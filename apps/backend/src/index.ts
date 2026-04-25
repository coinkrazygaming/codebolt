require("dotenv").config();
import express from "express";
import cors from "cors";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { LLMClient, LLMProvider } from "./llm-client";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

// Import routes
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import settingsRoutes from "./routes/settings";
import gitConfigRoutes from "./routes/git-config";

const app = express();
app.use(cors());
app.use(express.json());

// Get the default LLM provider from environment or use 'anthropic' as default
const getDefaultProvider = (): LLMProvider => {
  const provider = process.env.LLM_PROVIDER || "anthropic";
  if (provider !== "anthropic" && provider !== "xai") {
    console.warn(`Invalid LLM_PROVIDER: ${provider}, defaulting to anthropic`);
    return "anthropic";
  }
  return provider as LLMProvider;
};

// Helper to get LLM client for a request
const getLLMClient = (req: express.Request): LLMClient => {
  const provider = (req.query.provider as LLMProvider) || getDefaultProvider();
  return new LLMClient(provider);
};

// Register route handlers
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects/settings", settingsRoutes);
app.use("/api/projects/git-config", gitConfigRoutes);

// Existing LLM routes (unprotected for backward compatibility)
app.post("/template", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const llmClient = getLLMClient(req);

    const answer = await llmClient.generateText(
      [{ role: "user", content: prompt }],
      "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
      200
    );

    const normalizedAnswer = answer.trim().toLowerCase();

    if (normalizedAnswer === "react") {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (normalizedAnswer === "node") {
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    res.status(400).json({ message: "Invalid response from LLM" });
    return;
  } catch (error) {
    console.error("Error in /template:", error);
    res
      .status(500)
      .json({ message: "Failed to process template request", error: String(error) });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;
    const llmClient = getLLMClient(req);

    const response = await llmClient.generateText(
      messages,
      getSystemPrompt(),
      8000
    );

    res.json({
      response: response,
    });
  } catch (error) {
    console.error("Error in /chat:", error);
    res
      .status(500)
      .json({ message: "Failed to process chat request", error: String(error) });
  }
});

app.post("/api/auth/github", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Missing OAuth code" });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("GitHub OAuth credentials not configured");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    // Exchange code for access token
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    if (data.error) {
      return res
        .status(400)
        .json({ message: data.error_description || data.error });
    }

    res.json({
      access_token: data.access_token,
      token_type: data.token_type || "bearer",
      scope: data.scope,
    });
  } catch (error) {
    console.error("Error in GitHub auth:", error);
    res.status(500).json({
      message: "Failed to authenticate with GitHub",
      error: String(error),
    });
  }
});

app.listen(3000, () => {
  console.log("Backend server running on port 3000");
});
