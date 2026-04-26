import express, { Request, Response } from "express";
import {
  hashPassword,
  comparePassword,
  generateToken,
  sendError,
  sendSuccess,
} from "../auth";
import { authenticateRequest } from "../middleware";
import prisma from "../db";

const router = express.Router();

// Sign up
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    if (password.length < 6) {
      sendError(res, 400, "Password must be at least 6 characters");
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(res, 400, "Email already registered");
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create default space
    await prisma.space.create({
      data: {
        userId: user.id,
        name: "My Workspace",
      },
    });

    // Generate token
    const token = generateToken(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    sendSuccess(
      res,
      {
        user: { id: user.id, email: user.email, name: user.name },
        token,
      },
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    sendError(res, 500, "Failed to create account");
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Compare password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    sendSuccess(res, {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, 500, "Failed to login");
  }
});

// Logout
router.post(
  "/logout",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.substring(7);

      if (token) {
        await prisma.session.deleteMany({
          where: { token },
        });
      }

      sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      sendError(res, 500, "Failed to logout");
    }
  }
);

// Get current user
router.get(
  "/me",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, name: true, isAdmin: true, createdAt: true },
      });

      if (!user) {
        sendError(res, 404, "User not found");
        return;
      }

      sendSuccess(res, { user });
    } catch (error) {
      console.error("Get user error:", error);
      sendError(res, 500, "Failed to fetch user");
    }
  }
);

// GitHub OAuth callback
router.post("/github", async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      sendError(res, 400, "Missing OAuth code");
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("GitHub OAuth credentials not configured");
      sendError(res, 500, "Server misconfiguration");
      return;
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
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

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.statusText}`);
    }

    const data = (await tokenResponse.json()) as any;

    if (data.error) {
      sendError(res, 400, data.error_description || data.error);
      return;
    }

    if (!data.access_token) {
      sendError(res, 400, "No access token received from GitHub");
      return;
    }

    // Fetch GitHub user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${data.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch GitHub user: ${userResponse.statusText}`);
    }

    const gitHubUser = (await userResponse.json()) as any;

    // Find or create user in database
    let user = await prisma.user.findFirst({
      where: {
        email: gitHubUser.email || `${gitHubUser.login}@github.com`,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: gitHubUser.email || `${gitHubUser.login}@github.com`,
          name: gitHubUser.name || gitHubUser.login,
          password: "", // GitHub users don't have password
        },
      });

      // Create default workspace
      await prisma.space.create({
        data: {
          userId: user.id,
          name: "My Workspace",
        },
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    sendSuccess(
      res,
      {
        access_token: data.access_token,
        token_type: data.token_type || "bearer",
        scope: data.scope,
        user: { id: user.id, email: user.email, name: user.name },
        authToken: token,
      },
      200
    );
  } catch (error) {
    console.error("Error in GitHub auth:", error);
    sendError(res, 500, "Failed to authenticate with GitHub");
  }
});

// Initialize admin user (one-time setup)
router.post("/init-admin", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if any admin exists
    const adminExists = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (adminExists) {
      sendError(res, 400, "Admin user already exists");
      return;
    }

    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Just make them admin if they don't have a space
      const space = await prisma.space.findUnique({
        where: { userId: existingUser.id },
      });

      if (!space) {
        await prisma.space.create({
          data: {
            userId: existingUser.id,
            name: "Admin Space",
          },
        });
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { isAdmin: true },
      });

      sendSuccess(res, {
        message: "Existing user promoted to admin",
        user: { id: existingUser.id, email: existingUser.email },
      });
      return;
    }

    // Create new admin user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Admin",
        isAdmin: true,
      },
    });

    // Create admin space
    await prisma.space.create({
      data: {
        userId: user.id,
        name: "Admin Space",
      },
    });

    // Try to create default site settings and pricing plans
    try {
      const existingSettings = await prisma.siteSettings.findFirst();
      if (!existingSettings) {
        await prisma.siteSettings.create({
          data: {
            siteName: "Website Builder AI",
            primaryDomain: "builder.local",
            supportEmail: "support@example.com",
          },
        });
      }

      const existingPlans = await prisma.pricingPlan.count();
      if (existingPlans === 0) {
        await prisma.pricingPlan.createMany({
          data: [
            {
              name: "Free",
              price: 0,
              currency: "USD",
              projects: 1,
              storage: 1,
              features: ["1 Project", "1 GB Storage"],
              isActive: true,
            },
            {
              name: "Pro",
              price: 29,
              currency: "USD",
              projects: 10,
              storage: 100,
              features: [
                "10 Projects",
                "100 GB Storage",
                "Advanced Analytics",
                "Priority Support",
              ],
              isActive: true,
            },
            {
              name: "Enterprise",
              price: 99,
              currency: "USD",
              projects: 100,
              storage: 1000,
              features: [
                "100 Projects",
                "1000 GB Storage",
                "Advanced Analytics",
                "24/7 Support",
                "Custom Integrations",
                "Dedicated Account Manager",
              ],
              isActive: true,
            },
          ],
        });
      }
    } catch (settingsError) {
      console.warn("Warning: Could not create default settings/pricing:", settingsError);
      // Continue anyway - settings can be created later
    }

    sendSuccess(
      res,
      {
        message: "Admin user created successfully",
        user: { id: user.id, email: user.email, name: user.name },
      },
      201
    );
  } catch (error) {
    console.error("Init admin error:", error);
    sendError(res, 500, "Failed to initialize admin");
  }
});

export default router;
