import type { HrTenantConfig } from '@/entities/hr/hr-tenant-config';

export interface UpdateHrTenantConfigData {
  empresaCidadaEnabled?: boolean;
  maternityLeaveDays?: number;
  paternityLeaveDays?: number;
  unionContributionEnabled?: boolean;
  unionContributionRate?: number | null;
  patEnabled?: boolean;
  patMonthlyValuePerEmployee?: number | null;
  timeBankIndividualMonths?: number;
  timeBankCollectiveMonths?: number;
  ratPercent?: number;
  fapFactor?: number;
  terceirosPercent?: number;
}

export interface HrTenantConfigRepository {
  findByTenantId(tenantId: string): Promise<HrTenantConfig | null>;
  create(tenantId: string): Promise<HrTenantConfig>;
  update(
    tenantId: string,
    data: UpdateHrTenantConfigData,
  ): Promise<HrTenantConfig>;
}
