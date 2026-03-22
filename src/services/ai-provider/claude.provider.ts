import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Pricing per million tokens (USD)
const CLAUDE_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-3-20250305': { input: 0.8, output: 4.0 },
};

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Array<{
    type: string;
    text?: string;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeProvider implements AiProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel?: string) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel ?? 'claude-sonnet-4-20250514';
  }

  async complete(
    messages: AiProviderMessage[],
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    // Anthropic API requires system prompt separate from messages
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model,
      messages: chatMessages,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as AnthropicResponse;

    const content =
      data.content
        ?.filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n') ?? '';

    const tokensInput = data.usage?.input_tokens ?? 0;
    const tokensOutput = data.usage?.output_tokens ?? 0;

    const pricing = CLAUDE_PRICING[model] ?? { input: 3.0, output: 15.0 };
    const estimatedCost =
      (tokensInput * pricing.input + tokensOutput * pricing.output) / 1_000_000;

    return {
      content,
      model: data.model ?? model,
      tokensInput,
      tokensOutput,
      latencyMs,
      estimatedCost,
    };
  }

  getAvailableModels(): string[] {
    return ['claude-sonnet-4-20250514', 'claude-haiku-3-20250305'];
  }

  getProviderName(): string {
    return 'Claude';
  }
}
