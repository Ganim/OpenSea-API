import type { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import type { FocusNfeConfigRepository } from '@/repositories/sales/focus-nfe-config-repository';

export class InMemoryFocusNfeConfigRepository
  implements FocusNfeConfigRepository
{
  public items: FocusNfeConfig[] = [];

  async create(config: FocusNfeConfig): Promise<void> {
    this.items.push(config);
  }

  async findByTenant(tenantId: string): Promise<FocusNfeConfig | null> {
    return (
      this.items.find((cfg) => cfg.tenantId.toString() === tenantId) ?? null
    );
  }

  async save(config: FocusNfeConfig): Promise<void> {
    const index = this.items.findIndex(
      (cfg) => cfg.tenantId.toString() === config.tenantId.toString(),
    );
    if (index >= 0) {
      this.items[index] = config;
    }
  }

  async delete(tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (cfg) => cfg.tenantId.toString() === tenantId,
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
