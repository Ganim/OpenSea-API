import { describe, it, expect, beforeEach } from 'vitest';

import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
} from './ai-provider.interface';
import { AiRouter } from './ai-router';

class MockProvider implements AiProvider {
  public lastMessages: AiProviderMessage[] = [];
  public lastOptions?: AiProviderOptions;
  public shouldThrow = false;

  constructor(
    private name: string,
    private model: string,
  ) {}

  async complete(
    messages: AiProviderMessage[],
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse> {
    this.lastMessages = messages;
    this.lastOptions = options;

    if (this.shouldThrow) {
      throw new Error(`${this.name} error`);
    }

    return {
      content: `Response from ${this.name}`,
      model: this.model,
      tokensInput: 10,
      tokensOutput: 20,
      latencyMs: 100,
      estimatedCost: 0.001,
    };
  }

  getAvailableModels(): string[] {
    return [this.model];
  }

  getProviderName(): string {
    return this.name;
  }
}

describe('AiRouter', () => {
  let router: AiRouter;
  let tier1Provider: MockProvider;
  let tier2Provider: MockProvider;
  let tier3Provider: MockProvider;

  beforeEach(() => {
    router = new AiRouter();
    tier1Provider = new MockProvider('Groq-8B', 'llama-3.1-8b-instant');
    tier2Provider = new MockProvider('Groq-70B', 'llama-3.3-70b-versatile');
    tier3Provider = new MockProvider('Claude', 'claude-sonnet-4-20250514');

    router.registerProvider(1, tier1Provider);
    router.registerProvider(2, tier2Provider);
    router.registerProvider(3, tier3Provider);
  });

  it('should route to tier 1 by default', async () => {
    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    const result = await router.complete(messages);

    expect(result.content).toBe('Response from Groq-8B');
    expect(result.tier).toBe(1);
    expect(tier1Provider.lastMessages).toEqual(messages);
  });

  it('should route to tier 2 when specified', async () => {
    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Complex question' },
    ];

    const result = await router.complete(messages, 2);

    expect(result.content).toBe('Response from Groq-70B');
    expect(result.tier).toBe(2);
  });

  it('should route to tier 3 when specified', async () => {
    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Analyze this document' },
    ];

    const result = await router.complete(messages, 3);

    expect(result.content).toBe('Response from Claude');
    expect(result.tier).toBe(3);
  });

  it('should pass options to provider', async () => {
    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Hello' },
    ];
    const options = { temperature: 0.5, maxTokens: 1024 };

    await router.complete(messages, 1, options);

    expect(tier1Provider.lastOptions).toEqual(options);
  });

  it('should return correct response shape', async () => {
    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    const result = await router.complete(messages, 1);

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('tokensInput');
    expect(result).toHaveProperty('tokensOutput');
    expect(result).toHaveProperty('latencyMs');
    expect(result).toHaveProperty('estimatedCost');
    expect(result).toHaveProperty('tier');
  });

  it('should fallback to lower tier when requested tier is unavailable', async () => {
    const limitedRouter = new AiRouter();
    limitedRouter.registerProvider(1, tier1Provider);

    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    const result = await limitedRouter.complete(messages, 3);

    expect(result.content).toBe('Response from Groq-8B');
    expect(result.tier).toBe(1);
  });

  it('should throw when no providers are available', async () => {
    const emptyRouter = new AiRouter();

    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    await expect(emptyRouter.complete(messages, 1)).rejects.toThrow(
      'No AI provider available',
    );
  });

  it('should return available tiers sorted', () => {
    expect(router.getAvailableTiers()).toEqual([1, 2, 3]);
  });

  it('should return empty array when no providers registered', () => {
    const emptyRouter = new AiRouter();
    expect(emptyRouter.getAvailableTiers()).toEqual([]);
  });

  it('should get provider by tier', () => {
    expect(router.getProvider(1)).toBe(tier1Provider);
    expect(router.getProvider(2)).toBe(tier2Provider);
    expect(router.getProvider(3)).toBe(tier3Provider);
  });

  it('should return undefined for unregistered tier', () => {
    const limitedRouter = new AiRouter();
    expect(limitedRouter.getProvider(1)).toBeUndefined();
  });

  it('should propagate provider errors', async () => {
    tier1Provider.shouldThrow = true;

    const messages: AiProviderMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    await expect(router.complete(messages, 1)).rejects.toThrow('Groq-8B error');
  });
});
