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

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Pricing per million tokens (USD)
const CLAUDE_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-3-20250305': { input: 0.8, output: 4.0 },
};

interface AnthropicContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

export class ClaudeProvider implements AiProvider, AiProviderWithTools {
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
    const anthropicMessages: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemText = (msg as AiProviderMessage).content;
        continue;
      }

      if (msg.role === 'user') {
        anthropicMessages.push({
          role: 'user',
          content: (msg as AiProviderMessage).content,
        });
        continue;
      }

      if (msg.role === 'assistant') {
        // Assistant message with tool calls
        if ('toolCalls' in msg && msg.toolCalls?.length) {
          const contentBlocks: AnthropicContentBlock[] = [];

          // Include text if present
          if (msg.content) {
            contentBlocks.push({ type: 'text', text: msg.content });
          }

          // Add tool_use blocks
          for (const tc of msg.toolCalls) {
            contentBlocks.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.arguments,
            });
          }

          anthropicMessages.push({
            role: 'assistant',
            content: contentBlocks,
          });
          continue;
        }

        // Plain assistant text
        anthropicMessages.push({
          role: 'assistant',
          content: (msg as AiProviderMessage).content,
        });
        continue;
      }

      if (msg.role === 'tool') {
        // Tool result → Anthropic tool_result content block
        const toolMsg = msg as {
          role: 'tool';
          toolCallId: string;
          content: string;
        };

        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              id: toolMsg.toolCallId,
              text: toolMsg.content,
            } as unknown as AnthropicContentBlock,
          ],
        });
      }
    }

    // Convert tool definitions to Claude format
    const anthropicTools = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));

    const body: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      tools: anthropicTools,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
    };

    if (systemText) {
      body.system = systemText;
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

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const latencyMs = Date.now() - startTime;

    // Parse response content blocks — may contain text and/or tool_use
    const textParts: string[] = [];
    const toolCalls: AiProviderToolResponse['toolCalls'] = [];

    for (const block of data.content ?? []) {
      if (block.type === 'text' && block.text) {
        textParts.push(block.text);
      }
      if (block.type === 'tool_use' && block.id && block.name) {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input ?? {},
        });
      }
    }

    const tokensInput = data.usage?.input_tokens ?? 0;
    const tokensOutput = data.usage?.output_tokens ?? 0;
    const pricing = CLAUDE_PRICING[model] ?? { input: 3.0, output: 15.0 };
    const estimatedCost =
      (tokensInput * pricing.input + tokensOutput * pricing.output) / 1_000_000;

    return {
      content: textParts.length > 0 ? textParts.join('\n') : null,
      toolCalls: toolCalls.length > 0 ? toolCalls : null,
      model: data.model ?? model,
      tokensInput,
      tokensOutput,
      latencyMs,
      estimatedCost,
    };
  }
}
