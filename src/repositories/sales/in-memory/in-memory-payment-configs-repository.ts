import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';
import type {
  PaymentConfigsRepository,
  SavePaymentConfigSchema,
} from '../payment-configs-repository';

export class InMemoryPaymentConfigsRepository
  implements PaymentConfigsRepository
{
  public items: TenantPaymentConfig[] = [];

  async findByTenantId(tenantId: string): Promise<TenantPaymentConfig | null> {
    return (
      this.items.find(
        (config) => config.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async save(data: SavePaymentConfigSchema): Promise<TenantPaymentConfig> {
    const existingIndex = this.items.findIndex(
      (config) => config.tenantId.toString() === data.tenantId,
    );

    const config = TenantPaymentConfig.create({
      tenantId: new UniqueEntityID(data.tenantId),
      primaryProvider: data.primaryProvider,
      primaryConfig: data.primaryConfig,
      primaryActive: data.primaryActive,
      primaryTestedAt: data.primaryTestedAt,
      fallbackProvider: data.fallbackProvider,
      fallbackConfig: data.fallbackConfig,
      fallbackActive: data.fallbackActive,
      fallbackTestedAt: data.fallbackTestedAt,
    });

    if (existingIndex >= 0) {
      this.items[existingIndex] = config;
    } else {
      this.items.push(config);
    }

    return config;
  }

  async updateTestedAt(
    tenantId: string,
    slot: 'primary' | 'fallback',
    testedAt: Date,
  ): Promise<void> {
    const config = this.items.find(
      (c) => c.tenantId.toString() === tenantId,
    );

    if (config) {
      if (slot === 'primary') {
        config.primaryTestedAt = testedAt;
      } else {
        config.fallbackTestedAt = testedAt;
      }
    }
  }
}
