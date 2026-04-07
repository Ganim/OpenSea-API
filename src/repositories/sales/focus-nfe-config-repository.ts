import type { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';

export interface FocusNfeConfigRepository {
  create(config: FocusNfeConfig): Promise<void>;
  findByTenant(tenantId: string): Promise<FocusNfeConfig | null>;
  save(config: FocusNfeConfig): Promise<void>;
  delete(tenantId: string): Promise<void>;
}
