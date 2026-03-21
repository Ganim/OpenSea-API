import type { SupportSlaConfig } from '@/entities/core/support-sla-config';
import type { SupportSlaConfigsRepository } from '../support-sla-configs-repository';

export class InMemorySupportSlaConfigsRepository
  implements SupportSlaConfigsRepository
{
  public items: SupportSlaConfig[] = [];

  async findByPriority(priority: string): Promise<SupportSlaConfig | null> {
    const slaConfig = this.items.find((config) => config.priority === priority);
    return slaConfig ?? null;
  }

  async findAll(): Promise<SupportSlaConfig[]> {
    return [...this.items];
  }

  async save(slaConfig: SupportSlaConfig): Promise<void> {
    const index = this.items.findIndex((existingConfig) =>
      existingConfig.id.equals(slaConfig.id),
    );
    if (index !== -1) {
      this.items[index] = slaConfig;
    } else {
      this.items.push(slaConfig);
    }
  }
}
