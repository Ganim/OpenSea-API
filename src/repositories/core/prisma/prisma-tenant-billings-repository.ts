import {
  tenantBillingPrismaToDomain,
  tenantBillingToPrisma,
} from '@/mappers/core/tenant-billing-mapper';
import { prisma } from '@/lib/prisma';
import type { TenantBilling } from '@/entities/core/tenant-billing';
import type { Prisma } from '@prisma/generated/client';
import type { TenantBillingsRepository } from '../tenant-billings-repository';

export class PrismaTenantBillingsRepository
  implements TenantBillingsRepository
{
  async findByTenantId(tenantId: string): Promise<TenantBilling[]> {
    const billingsDb = await prisma.tenantBilling.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return billingsDb.map(tenantBillingPrismaToDomain);
  }

  async findByTenantAndPeriod(
    tenantId: string,
    period: string,
  ): Promise<TenantBilling | null> {
    const billingDb = await prisma.tenantBilling.findFirst({
      where: { tenantId, referenceMonth: period },
    });
    if (!billingDb) return null;

    return tenantBillingPrismaToDomain(billingDb);
  }

  async findByStatus(status: string): Promise<TenantBilling[]> {
    const billingsDb = await prisma.tenantBilling.findMany({
      where: { status: status as never },
      orderBy: { createdAt: 'desc' },
    });

    return billingsDb.map(tenantBillingPrismaToDomain);
  }

  async create(entity: TenantBilling): Promise<void> {
    const prismaData = tenantBillingToPrisma(entity);

    await prisma.tenantBilling.create({
      data: prismaData as Prisma.TenantBillingUncheckedCreateInput,
    });
  }

  async save(entity: TenantBilling): Promise<void> {
    const prismaData = tenantBillingToPrisma(entity);

    await prisma.tenantBilling.update({
      where: { id: prismaData.id },
      data: prismaData as Prisma.TenantBillingUncheckedUpdateInput,
    });
  }
}
