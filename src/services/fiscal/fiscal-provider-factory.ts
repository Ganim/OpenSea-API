import type { FiscalProvider as FiscalProviderType } from '@/entities/fiscal/fiscal-config';
import type { FiscalProvider } from './fiscal-provider.interface';
import { FocusNFeProvider } from './focus-nfe.provider';
import { NFeWizardProvider } from './nfewizard.provider';
import { NuvemFiscalProvider } from './nuvem-fiscal.provider';
import { WebmaniaBRProvider } from './webmaniabr.provider';

const providerInstances = new Map<FiscalProviderType, FiscalProvider>();

/**
 * Returns a FiscalProvider implementation based on the provider type.
 *
 * Uses a singleton cache to avoid re-instantiation on every call.
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
      provider = new FocusNFeProvider();
      break;

    case 'WEBMANIABR':
      provider = new WebmaniaBRProvider();
      break;

    case 'NFEWIZARD':
      provider = new NFeWizardProvider();
      break;

    default:
      throw new Error(`Unknown fiscal provider: ${providerType}`);
  }

  providerInstances.set(providerType, provider);
  return provider;
}
