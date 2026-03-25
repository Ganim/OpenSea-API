import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';

const OLLAMA_MODELS = {
  'llama3.2': 'Fast, lightweight (3B) — classification, extraction',
  'llama3.1': 'Balanced (8B) — summaries, analysis, general tasks',
  'qwen2.5-coder': 'Code-specialized — generation, review, refactoring',
} as const;

interface OllamaChatResponse {
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

export class OllamaProvider implements AiProvider {
  private host: string;
  private defaultModel: string;

  constructor(host?: string, defaultModel?: string) {
    this.host = (host ?? DEFAULT_OLLAMA_HOST).replace(/\/+$/, '');
    this.defaultModel = defaultModel ?? 'llama3.2';
  }

  async complete(
    messages: AiProviderMessage[],
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    let response: Response;

    try {
      response = await fetch(`${this.host}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Ollama connection failed at ${this.host}. Is Ollama running? (${message})`,
      );
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as OllamaChatResponse;

    const content = data.choices?.[0]?.message?.content ?? '';
    const tokensInput = data.usage?.prompt_tokens ?? 0;
    const tokensOutput = data.usage?.completion_tokens ?? 0;

    return {
      content,
      model: data.model ?? model,
      tokensInput,
      tokensOutput,
      latencyMs,
      estimatedCost: 0, // Local — no cost
    };
  }

  /**
   * Check if Ollama is running and reachable.
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    models: string[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return { healthy: false, models: [], error: `HTTP ${response.status}` };
      }

      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };
      const models = data.models?.map((m) => m.name) ?? [];

      return { healthy: true, models };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        healthy: false,
        models: [],
        error: `Ollama unreachable at ${this.host}: ${message}`,
      };
    }
  }

  supportsTools(): boolean {
    return false;
  }

  getAvailableModels(): string[] {
    return Object.keys(OLLAMA_MODELS);
  }

  getProviderName(): string {
    return 'Ollama';
  }
}
