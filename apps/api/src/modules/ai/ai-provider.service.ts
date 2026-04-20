import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private client: Anthropic;
  private model: string;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.getOrThrow("ANTHROPIC_API_KEY"),
    });
    this.model = this.config.get("AI_MODEL", "claude-sonnet-4-6");
  }

  async generate(systemPrompt: string, userContent: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected AI response type");
    return block.text;
  }

  async generateJson<T>(systemPrompt: string, userContent: string): Promise<T> {
    const raw = await this.generate(systemPrompt, userContent);
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : raw;
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      this.logger.warn("AI returned non-JSON, wrapping in summary");
      return { summary: raw } as T;
    }
  }
}
