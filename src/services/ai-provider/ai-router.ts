import type {
  AiProvider,
  AiProviderMessage,
  AiProviderOptions,
  AiProviderResponse,
  AiTier,
} from './ai-provider.interface';

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
