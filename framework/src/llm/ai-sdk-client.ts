import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LLMConfig } from "./llm-config.js";

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM Client using Vercel AI SDK
 * Supports: OpenAI, Gemini, DeepSeek
 */
export class AISdkLLMClient {
  constructor(private config: LLMConfig) {}

  async complete(prompt: string): Promise<LLMResponse> {
    try {
      const model = this.getModel();

      const { text, usage } = await generateText({
        model,
        prompt,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        topP: this.config.topP,
      });

      return {
        content: text,
        model: this.config.model,
        usage: usage
          ? {
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens,
            }
          : undefined,
      };
    } catch (error: any) {
      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }

  private getModel() {
    switch (this.config.provider) {
      case "openai": {
        const openai = createOpenAI({
          apiKey: this.config.apiKey || process.env.OPENAI_API_KEY,
        });
        return openai(this.config.model);
      }

      case "gemini": {
        const google = createGoogleGenerativeAI({
          apiKey:
            this.config.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });
        return google(this.config.model);
      }

      case "deepseek": {
        const deepseek = createOpenAI({
          apiKey: this.config.apiKey || process.env.DEEPSEEK_API_KEY,
          baseURL: this.config.baseURL || "https://api.deepseek.com/v1",
        });
        return deepseek(this.config.model);
      }

      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }
}
