import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type LLMProvider = "anthropic" | "xai";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export class LLMClient {
  private anthropicClient: Anthropic | null = null;
  private xaiClient: OpenAI | null = null;
  private provider: LLMProvider;

  constructor(provider: LLMProvider = "anthropic") {
    this.provider = provider;

    if (provider === "anthropic") {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else if (provider === "xai") {
      this.xaiClient = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1",
      });
    }
  }

  async generateText(
    messages: Message[],
    systemPrompt: string,
    maxTokens: number = 8000
  ): Promise<string> {
    if (this.provider === "anthropic") {
      if (!this.anthropicClient) {
        throw new Error("Anthropic client not initialized");
      }
      const response = await this.anthropicClient.messages.create({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        model: "claude-3-5-sonnet-20241022",
        max_tokens: maxTokens,
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
      throw new Error("Unexpected response type from Anthropic");
    } else if (this.provider === "xai") {
      if (!this.xaiClient) {
        throw new Error("xAI client not initialized");
      }
      const response = await this.xaiClient.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        model: "grok-beta",
        max_tokens: maxTokens,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from xAI");
      }
      return content;
    }

    throw new Error(`Unknown provider: ${this.provider}`);
  }

  setProvider(provider: LLMProvider) {
    this.provider = provider;
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}
