import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Pricing per million tokens (USD)
const GROQ_PRICING: Record<string, { input: number; output: number }> = {
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
};

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqProvider implements AiProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel?: string) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel ?? 'llama-3.1-8b-instant';
  }

  async complete(
    messages: AiProviderMessage[],
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Groq API error (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as GroqChatResponse;

    const content = data.choices?.[0]?.message?.content ?? '';
    const tokensInput = data.usage?.prompt_tokens ?? 0;
    const tokensOutput = data.usage?.completion_tokens ?? 0;

    const pricing = GROQ_PRICING[model] ?? { input: 0.05, output: 0.08 };
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
    return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  }

  getProviderName(): string {
    return 'Groq';
  }
}
