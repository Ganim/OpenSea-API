import type { SupportSlaConfig } from '@/entities/core/support-sla-config';

export interface SupportSlaConfigsRepository {
  findByPriority(priority: string): Promise<SupportSlaConfig | null>;
  findAll(): Promise<SupportSlaConfig[]>;
  save(slaConfig: SupportSlaConfig): Promise<void>;
}
