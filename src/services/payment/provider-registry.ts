/**
 * Payment Provider Registry.
 *
 * Maps provider names to their constructor classes.
 * Used by PaymentProviderFactory to instantiate the correct provider
 * based on tenant configuration.
 */

import type { PaymentProvider } from './payment-provider.interface'
import { ManualProvider } from './providers/manual.provider'
import {
  InfinitePayProvider,
  type InfinitePayConfig,
} from './providers/infinitepay.provider'
import {
  AsaasProvider,
  type AsaasConfig,
} from './providers/asaas.provider'

export type ProviderName = 'manual' | 'infinitepay' | 'asaas'

/** Config type per provider */
export type ProviderConfigMap = {
  manual: Record<string, never>
  infinitepay: InfinitePayConfig
  asaas: AsaasConfig
}

/**
 * Instantiate a payment provider by name with its config.
 */
export function createPaymentProvider<T extends ProviderName>(
  name: T,
  config: ProviderConfigMap[T],
): PaymentProvider {
  switch (name) {
    case 'manual':
      return new ManualProvider()
    case 'infinitepay':
      return new InfinitePayProvider(config as InfinitePayConfig)
    case 'asaas':
      return new AsaasProvider(config as AsaasConfig)
    default:
      throw new Error(`Unknown payment provider: ${name}`)
  }
}

/**
 * Registry of available providers (for listing in UI).
 */
export const PAYMENT_PROVIDERS: Record<
  ProviderName,
  {
    displayName: string
    getConfigFields: () => ReturnType<PaymentProvider['getConfigFields']>
  }
> = {
  manual: {
    displayName: 'Manual',
    getConfigFields: () => new ManualProvider().getConfigFields(),
  },
  infinitepay: {
    displayName: 'InfinitePay',
    getConfigFields: () =>
      new InfinitePayProvider({
        clientId: '',
        clientSecret: '',
      }).getConfigFields(),
  },
  asaas: {
    displayName: 'Asaas',
    getConfigFields: () =>
      new AsaasProvider({
        apiKey: '',
        environment: 'sandbox',
      }).getConfigFields(),
  },
}

/**
 * List of all available provider names.
 */
export const AVAILABLE_PROVIDERS: ProviderName[] = [
  'manual',
  'infinitepay',
  'asaas',
]
