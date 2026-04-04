import type { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';

export interface SavePaymentConfigSchema {
  tenantId: string;
  primaryProvider: string;
  primaryConfig: string;
  primaryActive: boolean;
  primaryTestedAt?: Date;
  fallbackProvider?: string;
  fallbackConfig?: string;
  fallbackActive: boolean;
  fallbackTestedAt?: Date;
}

export interface PaymentConfigsRepository {
  findByTenantId(tenantId: string): Promise<TenantPaymentConfig | null>;
  save(data: SavePaymentConfigSchema): Promise<TenantPaymentConfig>;
  updateTestedAt(
    tenantId: string,
    slot: 'primary' | 'fallback',
    testedAt: Date,
  ): Promise<void>;
}
