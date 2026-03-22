import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-pro-preview-06-05': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash-preview-05-20': { input: 0.15, output: 0.6 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
};

interface GeminiContent {
  role: string;
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion: string;
}

export class GeminiProvider implements AiProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel?: string) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel ?? 'gemini-2.5-pro-preview-06-05';
  }

  async complete(
    messages: AiProviderMessage[],
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    // Separate system instruction from messages
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    // Convert to Gemini format
    const contents: GeminiContent[] = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const latencyMs = Date.now() - startTime;

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokensInput = data.usageMetadata?.promptTokenCount ?? 0;
    const tokensOutput = data.usageMetadata?.candidatesTokenCount ?? 0;

    const pricing = GEMINI_PRICING[model] ?? { input: 1.25, output: 10.0 };
    const estimatedCost =
      (tokensInput / 1_000_000) * pricing.input +
      (tokensOutput / 1_000_000) * pricing.output;

    return {
      content,
      model: data.modelVersion ?? model,
      tokensInput,
      tokensOutput,
      latencyMs,
      estimatedCost,
    };
  }

  getAvailableModels(): string[] {
    return Object.keys(GEMINI_PRICING);
  }

  getProviderName(): string {
    return 'google-gemini';
  }
}
