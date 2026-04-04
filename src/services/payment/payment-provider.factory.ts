import { getFieldCipherService } from '@/services/security/field-cipher-service';
import type { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';
import type { PosPaymentMethod } from '@/entities/sales/pos-transaction-payment';
import type { PaymentProvider } from './payment-provider.interface';
import { ManualProvider } from './providers/manual.provider';
import { createPaymentProvider, type ProviderName } from './provider-registry';

export class PaymentProviderFactory {
  /**
   * Resolve the appropriate payment provider for a given method.
   *
   * 1. If primaryProvider is active and supports the method -> return primary
   * 2. If fallbackProvider is active and supports the method -> return fallback
   * 3. Otherwise -> return ManualProvider
   */
  resolve(
    tenantConfig: TenantPaymentConfig | null,
    method: PosPaymentMethod,
  ): PaymentProvider {
    if (!tenantConfig) {
      return new ManualProvider();
    }

    const cipherService = getFieldCipherService();

    // Try primary provider
    if (tenantConfig.primaryActive && tenantConfig.primaryConfig) {
      const primaryProvider = this.instantiateProvider(
        tenantConfig.primaryProvider,
        tenantConfig.primaryConfig,
        cipherService,
      );

      if (
        primaryProvider &&
        primaryProvider.supportedMethods.includes(
          method as (typeof primaryProvider.supportedMethods)[number],
        )
      ) {
        return primaryProvider;
      }
    }

    // Try fallback provider
    if (
      tenantConfig.fallbackProvider &&
      tenantConfig.fallbackActive &&
      tenantConfig.fallbackConfig
    ) {
      const fallbackProvider = this.instantiateProvider(
        tenantConfig.fallbackProvider,
        tenantConfig.fallbackConfig,
        cipherService,
      );

      if (
        fallbackProvider &&
        fallbackProvider.supportedMethods.includes(
          method as (typeof fallbackProvider.supportedMethods)[number],
        )
      ) {
        return fallbackProvider;
      }
    }

    // Default to ManualProvider
    return new ManualProvider();
  }

  private instantiateProvider(
    providerName: string,
    encryptedConfig: string,
    cipherService: { decrypt(ciphertext: string): string },
  ): PaymentProvider | null {
    try {
      if (providerName === 'manual') {
        return new ManualProvider();
      }

      const decryptedConfigJson = cipherService.decrypt(encryptedConfig);
      const parsedConfig = JSON.parse(decryptedConfigJson);

      return createPaymentProvider(
        providerName as ProviderName,
        parsedConfig,
      );
    } catch (error) {
      console.error(
        `[PaymentProviderFactory] Failed to instantiate provider "${providerName}":`,
        error,
      );
      return null;
    }
  }
}
