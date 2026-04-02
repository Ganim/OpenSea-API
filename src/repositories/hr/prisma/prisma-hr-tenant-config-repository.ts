import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { HrTenantConfig } from '@/entities/hr/hr-tenant-config';
import { prisma } from '@/lib/prisma';
import type {
  HrTenantConfigRepository,
  UpdateHrTenantConfigData,
} from '../hr-tenant-config-repository';

function mapPrismaToDomain(data: {
  id: string;
  tenantId: string;
  empresaCidadaEnabled: boolean;
  maternityLeaveDays: number;
  paternityLeaveDays: number;
  unionContributionEnabled: boolean;
  unionContributionRate: unknown;
  patEnabled: boolean;
  patMonthlyValuePerEmployee: unknown;
  timeBankIndividualMonths: number;
  timeBankCollectiveMonths: number;
  ratPercent: unknown;
  fapFactor: unknown;
  terceirosPercent: unknown;
  createdAt: Date;
  updatedAt: Date;
}): HrTenantConfig {
  return HrTenantConfig.create(
    {
      tenantId: data.tenantId,
      empresaCidadaEnabled: data.empresaCidadaEnabled,
      maternityLeaveDays: data.maternityLeaveDays,
      paternityLeaveDays: data.paternityLeaveDays,
      unionContributionEnabled: data.unionContributionEnabled,
      unionContributionRate:
        data.unionContributionRate != null
          ? Number(data.unionContributionRate)
          : null,
      patEnabled: data.patEnabled,
      patMonthlyValuePerEmployee:
        data.patMonthlyValuePerEmployee != null
          ? Number(data.patMonthlyValuePerEmployee)
          : null,
      timeBankIndividualMonths: data.timeBankIndividualMonths,
      timeBankCollectiveMonths: data.timeBankCollectiveMonths,
      ratPercent: Number(data.ratPercent),
      fapFactor: Number(data.fapFactor),
      terceirosPercent: Number(data.terceirosPercent),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaHrTenantConfigRepository
  implements HrTenantConfigRepository
{
  async findByTenantId(tenantId: string): Promise<HrTenantConfig | null> {
    const data = await prisma.hrTenantConfig.findUnique({
      where: { tenantId },
    });

    if (!data) return null;

    return mapPrismaToDomain(data);
  }

  async create(tenantId: string): Promise<HrTenantConfig> {
    const data = await prisma.hrTenantConfig.create({
      data: { tenantId },
    });

    return mapPrismaToDomain(data);
  }

  async update(
    tenantId: string,
    updateData: UpdateHrTenantConfigData,
  ): Promise<HrTenantConfig> {
    const data = await prisma.hrTenantConfig.update({
      where: { tenantId },
      data: updateData,
    });

    return mapPrismaToDomain(data);
  }
}
