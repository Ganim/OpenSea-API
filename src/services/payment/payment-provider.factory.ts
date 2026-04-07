import type { PosPaymentMethod } from '@/entities/sales/pos-transaction-payment';
import type { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import type { PaymentProvider } from './payment-provider.interface';
import { createPaymentProvider, type ProviderName } from './provider-registry';
import { ManualProvider } from './providers/manual.provider';

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

  /**
   * Resolve provider by explicit provider name from a persisted charge.
   * Falls back to method-based resolution when explicit configuration is unavailable.
   */
  resolveByName(
    tenantConfig: TenantPaymentConfig | null,
    providerName: string,
    methodFallback: PosPaymentMethod,
  ): PaymentProvider {
    if (!tenantConfig || providerName === 'manual') {
      return this.resolve(tenantConfig, methodFallback);
    }

    const cipherService = getFieldCipherService();

    if (
      tenantConfig.primaryProvider === providerName &&
      tenantConfig.primaryActive &&
      tenantConfig.primaryConfig
    ) {
      const provider = this.instantiateProvider(
        tenantConfig.primaryProvider,
        tenantConfig.primaryConfig,
        cipherService,
      );

      if (provider) {
        return provider;
      }
    }

    if (
      tenantConfig.fallbackProvider === providerName &&
      tenantConfig.fallbackActive &&
      tenantConfig.fallbackConfig
    ) {
      const provider = this.instantiateProvider(
        tenantConfig.fallbackProvider,
        tenantConfig.fallbackConfig,
        cipherService,
      );

      if (provider) {
        return provider;
      }
    }

    return this.resolve(tenantConfig, methodFallback);
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

      return createPaymentProvider(providerName as ProviderName, parsedConfig);
    } catch (error) {
      console.error(
        `[PaymentProviderFactory] Failed to instantiate provider "${providerName}":`,
        error,
      );
      return null;
    }
  }
}
