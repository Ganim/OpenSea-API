import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
  AiTier,
} from './ai-provider.interface';
import type {
  AiAgenticMessage,
  AiProviderToolResponse,
  AiProviderWithTools,
  ToolDefinition,
} from '@/services/ai-tools/tool-types';

function isProviderWithTools(
  provider: AiProvider,
): provider is AiProvider & AiProviderWithTools {
  const candidate = provider as Partial<AiProviderWithTools>;
  return (
    typeof candidate.completeWithTools === 'function' &&
    typeof candidate.supportsTools === 'function' &&
    candidate.supportsTools()
  );
}

export class AiRouter {
  private providers: Map<AiTier, AiProvider> = new Map();

  registerProvider(tier: AiTier, provider: AiProvider): void {
    this.providers.set(tier, provider);
  }

  async complete(
    messages: AiProviderMessage[],
    tier?: AiTier,
    options?: AiProviderOptions,
  ): Promise<AiProviderResponse & { tier: AiTier }> {
    const selectedTier = tier ?? 1;
    const provider = this.providers.get(selectedTier);

    if (!provider) {
      // Fallback: try lower tiers
      const fallbackTier = this.findFallbackTier(selectedTier);

      if (!fallbackTier) {
        throw new Error(
          `No AI provider available for tier ${selectedTier} or any fallback tier`,
        );
      }

      const fallbackProvider = this.providers.get(fallbackTier)!;
      const response = await fallbackProvider.complete(messages, options);
      return { ...response, tier: fallbackTier };
    }

    const response = await provider.complete(messages, options);
    return { ...response, tier: selectedTier };
  }

  getProvider(tier: AiTier): AiProvider | undefined {
    return this.providers.get(tier);
  }

  getAvailableTiers(): AiTier[] {
    return Array.from(this.providers.keys()).sort();
  }

  async completeWithTools(
    messages: AiAgenticMessage[],
    tools: ToolDefinition[],
    tier?: AiTier,
    options?: AiProviderOptions,
  ): Promise<AiProviderToolResponse & { tier: AiTier }> {
    const selectedTier = tier ?? 3;

    // Try selected tier first
    const provider = this.providers.get(selectedTier);
    if (provider && isProviderWithTools(provider)) {
      const response = await provider.completeWithTools(
        messages,
        tools,
        options,
      );
      return { ...response, tier: selectedTier };
    }

    // Fallback: find any tier that supports tools
    const toolTier = this.findToolCapableTier(selectedTier);
    if (!toolTier) {
      throw new Error(
        'No AI provider with tool support available on any tier',
      );
    }

    const fallbackProvider = this.providers.get(toolTier)!;
    const response = await (
      fallbackProvider as AiProvider & AiProviderWithTools
    ).completeWithTools(messages, tools, options);
    return { ...response, tier: toolTier };
  }

  private findToolCapableTier(excludeTier: AiTier): AiTier | null {
    const tiers: AiTier[] = [3, 2, 1];
    for (const t of tiers) {
      if (t === excludeTier) continue;
      const provider = this.providers.get(t);
      if (provider && isProviderWithTools(provider)) {
        return t;
      }
    }
    return null;
  }

  private findFallbackTier(requestedTier: AiTier): AiTier | null {
    // Try lower tiers first (3 -> 2 -> 1), then higher
    const tiers: AiTier[] = [3, 2, 1];
    const lowerTiers = tiers.filter((t) => t < requestedTier);
    const higherTiers = tiers.filter((t) => t > requestedTier);

    for (const t of [...lowerTiers, ...higherTiers]) {
      if (this.providers.has(t)) {
        return t;
      }
    }

    return null;
  }
}
