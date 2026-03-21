import {
  tenantConsumptionPrismaToDomain,
  tenantConsumptionToPrisma,
} from '@/mappers/core/tenant-consumption-mapper';
import { prisma } from '@/lib/prisma';
import type { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { Prisma } from '@prisma/generated/client';
import type { TenantConsumptionsRepository } from '../tenant-consumptions-repository';

export class PrismaTenantConsumptionsRepository
  implements TenantConsumptionsRepository
{
  async findByTenantAndPeriod(
    tenantId: string,
    period: string,
  ): Promise<TenantConsumption[]> {
    const consumptionsDb = await prisma.tenantConsumption.findMany({
      where: { tenantId, period },
      orderBy: { metric: 'asc' },
    });

    return consumptionsDb.map(tenantConsumptionPrismaToDomain);
  }

  async findByTenantPeriodAndMetric(
    tenantId: string,
    period: string,
    metric: string,
  ): Promise<TenantConsumption | null> {
    const consumptionDb = await prisma.tenantConsumption.findUnique({
      where: { tenantId_period_metric: { tenantId, period, metric } },
    });
    if (!consumptionDb) return null;

    return tenantConsumptionPrismaToDomain(consumptionDb);
  }

  async findByPeriodAndMetricPrefix(
    period: string,
    metricPrefix: string,
  ): Promise<TenantConsumption[]> {
    const consumptionsDb = await prisma.tenantConsumption.findMany({
      where: {
        period,
        metric: { startsWith: metricPrefix },
      },
      orderBy: { metric: 'asc' },
    });

    return consumptionsDb.map(tenantConsumptionPrismaToDomain);
  }

  async upsert(entity: TenantConsumption): Promise<void> {
    const prismaData = tenantConsumptionToPrisma(entity);

    await prisma.tenantConsumption.upsert({
      where: {
        tenantId_period_metric: {
          tenantId: prismaData.tenantId,
          period: prismaData.period,
          metric: prismaData.metric,
        },
      },
      create: prismaData as Prisma.TenantConsumptionUncheckedCreateInput,
      update: prismaData as Prisma.TenantConsumptionUncheckedUpdateInput,
    });
  }

  async incrementUsage(
    tenantId: string,
    period: string,
    metric: string,
    amount: number,
  ): Promise<void> {
    await prisma.tenantConsumption.update({
      where: { tenantId_period_metric: { tenantId, period, metric } },
      data: {
        used: { increment: amount },
      },
    });
  }
}
