import type { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import type { TransactionClient } from '@/lib/transaction-manager';

import type { PosFiscalConfigsRepository } from '../pos-fiscal-configs-repository';

export class InMemoryPosFiscalConfigsRepository
  implements PosFiscalConfigsRepository
{
  public items: PosFiscalConfig[] = [];

  async findByTenantId(tenantId: string): Promise<PosFiscalConfig | null> {
    return this.items.find((c) => c.tenantId === tenantId) ?? null;
  }

  async upsert(
    config: PosFiscalConfig,
    _tx?: TransactionClient,
  ): Promise<void> {
    const existingIndex = this.items.findIndex(
      (c) => c.tenantId === config.tenantId,
    );
    if (existingIndex >= 0) {
      this.items[existingIndex] = config;
    } else {
      this.items.push(config);
    }
  }

  async incrementNfceNumber(
    tenantId: string,
    _tx?: TransactionClient,
  ): Promise<number> {
    const config = this.items.find((c) => c.tenantId === tenantId);
    if (!config) {
      throw new Error(`PosFiscalConfig not found for tenant ${tenantId}`);
    }
    return config.incrementNfceNumber();
  }
}
