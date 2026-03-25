import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';

export interface FiscalConfigsRepository {
  findByTenantId(tenantId: string): Promise<FiscalConfig | null>;
  create(config: FiscalConfig): Promise<void>;
  save(config: FiscalConfig): Promise<void>;
}
