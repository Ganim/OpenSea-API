import type { FiscalProvider as FiscalProviderType } from '@/entities/fiscal/fiscal-config';
import type { FiscalProvider } from './fiscal-provider.interface';
import { NuvemFiscalProvider } from './nuvem-fiscal.provider';

const providerInstances = new Map<FiscalProviderType, FiscalProvider>();

/**
 * Returns a FiscalProvider implementation based on the provider type.
 *
 * Uses a singleton cache to avoid re-instantiation on every call.
 * Additional providers (FOCUS_NFE, WEBMANIABR, NFEWIZARD) can be
 * registered here as they are implemented.
 */
export function getFiscalProvider(
  providerType: FiscalProviderType,
): FiscalProvider {
  const cached = providerInstances.get(providerType);
  if (cached) return cached;

  let provider: FiscalProvider;

  switch (providerType) {
    case 'NUVEM_FISCAL':
      provider = new NuvemFiscalProvider();
      break;

    case 'FOCUS_NFE':
      // TODO: Implement FocusNFeProvider
      throw new Error(
        'FOCUS_NFE provider is not yet implemented. Use NUVEM_FISCAL.',
      );

    case 'WEBMANIABR':
      // TODO: Implement WebmaniaBRProvider
      throw new Error(
        'WEBMANIABR provider is not yet implemented. Use NUVEM_FISCAL.',
      );

    case 'NFEWIZARD':
      // TODO: Implement NFeWizardProvider
      throw new Error(
        'NFEWIZARD provider is not yet implemented. Use NUVEM_FISCAL.',
      );

    default:
      throw new Error(`Unknown fiscal provider: ${providerType}`);
  }

  providerInstances.set(providerType, provider);
  return provider;
}
