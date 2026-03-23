import { randomUUID } from 'node:crypto';

import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';
import type {
  AiAgenticMessage,
  AiProviderToolResponse,
  AiProviderWithTools,
  ToolDefinition,
} from '@/services/ai-tools/tool-types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
};

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: {
    name: string;
    response: { content: string };
  };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: GeminiPart[];
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

export class GeminiProvider implements AiProvider, AiProviderWithTools {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel?: string) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel ?? 'gemini-2.5-pro';
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

  supportsTools(): boolean {
    return true;
  }

  async completeWithTools(
    messages: AiAgenticMessage[],
    tools: ToolDefinition[],
    options?: AiProviderOptions,
  ): Promise<AiProviderToolResponse> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    // Separate system instruction from messages
    let systemText: string | null = null;
    const contents: GeminiContent[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemText = (msg as AiProviderMessage).content;
        continue;
      }

      if (msg.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: (msg as AiProviderMessage).content }],
        });
        continue;
      }

      if (msg.role === 'assistant') {
        // Assistant message with tool calls
        if ('toolCalls' in msg && msg.toolCalls?.length) {
          contents.push({
            role: 'model',
            parts: msg.toolCalls.map((tc) => ({
              functionCall: { name: tc.name, args: tc.arguments },
            })),
          });
          continue;
        }

        // Plain assistant text
        contents.push({
          role: 'model',
          parts: [{ text: (msg as AiProviderMessage).content }],
        });
        continue;
      }

      if (msg.role === 'tool') {
        // Tool result → Gemini function role
        const toolMsg = msg as {
          role: 'tool';
          toolCallId: string;
          content: string;
          name?: string;
        };

        // Try to find the tool name from a preceding assistant message
        const toolName =
          toolMsg.name ?? this.findToolName(messages, toolMsg.toolCallId);

        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: toolName,
                response: { content: toolMsg.content },
              },
            },
          ],
        });
      }
    }

    // Convert tool definitions to Gemini format
    const functionDeclarations = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    const body: Record<string, unknown> = {
      contents,
      tools: [{ functionDeclarations }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    };

    if (systemText) {
      body.systemInstruction = { parts: [{ text: systemText }] };
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

    // Parse response parts — may contain text and/or function calls
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    const textParts: string[] = [];
    const toolCalls: AiProviderToolResponse['toolCalls'] = [];

    for (const part of parts) {
      if (part.text) {
        textParts.push(part.text);
      }
      if (part.functionCall) {
        toolCalls.push({
          id: randomUUID(),
          name: part.functionCall.name,
          arguments: part.functionCall.args ?? {},
        });
      }
    }

    const tokensInput = data.usageMetadata?.promptTokenCount ?? 0;
    const tokensOutput = data.usageMetadata?.candidatesTokenCount ?? 0;
    const pricing = GEMINI_PRICING[model] ?? { input: 1.25, output: 10.0 };
    const estimatedCost =
      (tokensInput / 1_000_000) * pricing.input +
      (tokensOutput / 1_000_000) * pricing.output;

    return {
      content: textParts.length > 0 ? textParts.join('\n') : null,
      toolCalls: toolCalls.length > 0 ? toolCalls : null,
      model: data.modelVersion ?? model,
      tokensInput,
      tokensOutput,
      latencyMs,
      estimatedCost,
    };
  }

  /**
   * Find the tool name for a given toolCallId by searching preceding
   * assistant messages that contain toolCalls.
   */
  private findToolName(
    messages: AiAgenticMessage[],
    toolCallId: string,
  ): string {
    for (const msg of messages) {
      if (msg.role === 'assistant' && 'toolCalls' in msg && msg.toolCalls) {
        const tc = msg.toolCalls.find((t) => t.id === toolCallId);
        if (tc) return tc.name;
      }
    }
    return 'unknown_tool';
  }
}
