import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplacePayment } from '@/entities/sales/marketplace-payment';
import type {
  MarketplacePaymentTypeValue,
  MarketplacePaymentStatusType,
} from '@/entities/sales/marketplace-payment';
import { prisma } from '@/lib/prisma';
import type { MarketplacePaymentsRepository } from '../marketplace-payments-repository';

function mapToDomain(data: Record<string, unknown>): MarketplacePayment {
  return MarketplacePayment.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      connectionId: new UniqueEntityID(data.connectionId as string),
      externalPaymentId: (data.externalPaymentId as string) ?? undefined,
      type: data.type as MarketplacePaymentTypeValue,
      description: (data.description as string) ?? undefined,
      grossAmount: Number(data.grossAmount),
      feeAmount: Number(data.feeAmount),
      netAmount: Number(data.netAmount),
      currency: data.currency as string,
      marketplaceOrderId: (data.marketplaceOrderId as string) ?? undefined,
      installmentNumber: (data.installmentNumber as number) ?? undefined,
      settlementDate: (data.settlementDate as Date) ?? undefined,
      status: data.status as MarketplacePaymentStatusType,
      financeEntryId: (data.financeEntryId as string) ?? undefined,
      metadata: (data.metadata as Record<string, unknown>) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaMarketplacePaymentsRepository
  implements MarketplacePaymentsRepository
{
  async findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplacePayment[]> {
    const records = await prisma.marketplacePayment.findMany({
      where: { connectionId, tenantId },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) =>
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async findManyByTenant(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplacePayment[]> {
    const records = await prisma.marketplacePayment.findMany({
      where: { tenantId },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) =>
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async countByConnection(
    connectionId: string,
    tenantId: string,
  ): Promise<number> {
    return prisma.marketplacePayment.count({
      where: { connectionId, tenantId },
    });
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.marketplacePayment.count({ where: { tenantId } });
  }

  async getReconciliation(
    connectionId: string,
    tenantId: string,
  ): Promise<{
    totalGross: number;
    totalFees: number;
    totalNet: number;
    pendingCount: number;
    settledCount: number;
  }> {
    const [agg, pendingCount, settledCount] = await Promise.all([
      prisma.marketplacePayment.aggregate({
        where: { connectionId, tenantId },
        _sum: { grossAmount: true, feeAmount: true, netAmount: true },
      }),
      prisma.marketplacePayment.count({
        where: { connectionId, tenantId, status: 'PENDING' },
      }),
      prisma.marketplacePayment.count({
        where: { connectionId, tenantId, status: 'SETTLED' },
      }),
    ]);

    return {
      totalGross: Number(agg._sum.grossAmount ?? 0),
      totalFees: Number(agg._sum.feeAmount ?? 0),
      totalNet: Number(agg._sum.netAmount ?? 0),
      pendingCount,
      settledCount,
    };
  }
}
