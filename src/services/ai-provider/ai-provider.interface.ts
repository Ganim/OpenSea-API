export interface AiProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiProviderOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AiProviderResponse {
  content: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  estimatedCost: number;
}

export interface AiProvider {
  complete(
    messages: AiProviderMessage[],
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse>;
  getAvailableModels(): string[];
  getProviderName(): string;
}

export type AiTier = 1 | 2 | 3;

// Re-export tool-related interfaces for convenience
export type {
  AiProviderWithTools,
  AiProviderToolResponse,
} from '@/services/ai-tools/tool-types';
