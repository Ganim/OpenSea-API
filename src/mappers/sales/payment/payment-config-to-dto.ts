import type { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';

export interface PaymentConfigDTO {
  id: string;
  tenantId: string;
  primaryProvider: string;
  primaryActive: boolean;
  primaryTestedAt?: Date;
  fallbackProvider?: string;
  fallbackActive: boolean;
  fallbackTestedAt?: Date;
  isConfigured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function paymentConfigToDTO(
  config: TenantPaymentConfig,
): PaymentConfigDTO {
  return {
    id: config.id.toString(),
    tenantId: config.tenantId.toString(),
    primaryProvider: config.primaryProvider,
    primaryActive: config.primaryActive,
    primaryTestedAt: config.primaryTestedAt,
    fallbackProvider: config.fallbackProvider,
    fallbackActive: config.fallbackActive,
    fallbackTestedAt: config.fallbackTestedAt,
    isConfigured: config.primaryActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}
