import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type { FiscalConfigsRepository } from '../fiscal-configs-repository';

export class InMemoryFiscalConfigsRepository
  implements FiscalConfigsRepository
{
  public items: FiscalConfig[] = [];

  async findByTenantId(tenantId: string): Promise<FiscalConfig | null> {
    const config = this.items.find(
      (item) => item.tenantId.toString() === tenantId,
    );
    return config ?? null;
  }

  async create(config: FiscalConfig): Promise<void> {
    this.items.push(config);
  }

  async save(config: FiscalConfig): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(config.id));
    if (index >= 0) {
      this.items[index] = config;
    } else {
      this.items.push(config);
    }
  }
}
