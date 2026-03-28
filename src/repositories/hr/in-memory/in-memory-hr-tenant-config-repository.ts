import { HrTenantConfig } from '@/entities/hr/hr-tenant-config';
import type {
  HrTenantConfigRepository,
  UpdateHrTenantConfigData,
} from '../hr-tenant-config-repository';

export class InMemoryHrTenantConfigRepository implements HrTenantConfigRepository {
  public items: HrTenantConfig[] = [];

  async findByTenantId(tenantId: string): Promise<HrTenantConfig | null> {
    return this.items.find((config) => config.tenantId === tenantId) ?? null;
  }

  async create(tenantId: string): Promise<HrTenantConfig> {
    const config = HrTenantConfig.create({
      tenantId,
      empresaCidadaEnabled: false,
      maternityLeaveDays: 120,
      paternityLeaveDays: 5,
      unionContributionEnabled: false,
      unionContributionRate: null,
      patEnabled: false,
      patMonthlyValuePerEmployee: null,
      timeBankIndividualMonths: 6,
      timeBankCollectiveMonths: 12,
      ratPercent: 2,
      fapFactor: 1.0,
      terceirosPercent: 5.8,
    });

    this.items.push(config);
    return config;
  }

  async update(
    tenantId: string,
    data: UpdateHrTenantConfigData,
  ): Promise<HrTenantConfig> {
    const index = this.items.findIndex(
      (config) => config.tenantId === tenantId,
    );

    if (index === -1) {
      throw new Error(`HR config not found for tenant ${tenantId}`);
    }

    const existing = this.items[index];

    const updated = HrTenantConfig.create(
      {
        tenantId,
        empresaCidadaEnabled:
          data.empresaCidadaEnabled ?? existing.empresaCidadaEnabled,
        maternityLeaveDays:
          data.maternityLeaveDays ?? existing.maternityLeaveDays,
        paternityLeaveDays:
          data.paternityLeaveDays ?? existing.paternityLeaveDays,
        unionContributionEnabled:
          data.unionContributionEnabled ?? existing.unionContributionEnabled,
        unionContributionRate:
          data.unionContributionRate !== undefined
            ? data.unionContributionRate
            : existing.unionContributionRate,
        patEnabled: data.patEnabled ?? existing.patEnabled,
        patMonthlyValuePerEmployee:
          data.patMonthlyValuePerEmployee !== undefined
            ? data.patMonthlyValuePerEmployee
            : existing.patMonthlyValuePerEmployee,
        timeBankIndividualMonths:
          data.timeBankIndividualMonths ?? existing.timeBankIndividualMonths,
        timeBankCollectiveMonths:
          data.timeBankCollectiveMonths ?? existing.timeBankCollectiveMonths,
        ratPercent: data.ratPercent ?? existing.ratPercent,
        fapFactor: data.fapFactor ?? existing.fapFactor,
        terceirosPercent: data.terceirosPercent ?? existing.terceirosPercent,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }
}
