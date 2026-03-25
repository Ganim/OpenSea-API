import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCredit } from '@/entities/sales/store-credit';
import { prisma } from '@/lib/prisma';
import { storeCreditPrismaToDomain } from '@/mappers/sales/store-credit/store-credit-prisma-to-domain';
import type {
  FindManyStoreCreditsParams,
  FindManyStoreCreditsResult,
  StoreCreditsRepository,
} from '../store-credits-repository';
import type { StoreCreditSource as PrismaSource } from '@prisma/generated/client.js';

export class PrismaStoreCreditsRepository implements StoreCreditsRepository {
  async create(credit: StoreCredit): Promise<void> {
    await prisma.storeCredit.create({
      data: {
        id: credit.id.toString(),
        tenantId: credit.tenantId.toString(),
        customerId: credit.customerId.toString(),
        amount: credit.amount,
        balance: credit.balance,
        source: credit.source as PrismaSource,
        sourceId: credit.sourceId ?? null,
        reservedForOrderId: credit.reservedForOrderId?.toString() ?? null,
        expiresAt: credit.expiresAt ?? null,
        isActive: credit.isActive,
        createdAt: credit.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StoreCredit | null> {
    const data = await prisma.storeCredit.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!data) return null;
    return storeCreditPrismaToDomain(data);
  }

  async findByCustomer(
    customerId: UniqueEntityID,
    tenantId: string,
    activeOnly = true,
  ): Promise<StoreCredit[]> {
    const where: Record<string, unknown> = {
      customerId: customerId.toString(),
      tenantId,
    };

    if (activeOnly) {
      where.isActive = true;
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
    }

    const items = await prisma.storeCredit.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
    });

    return items.map((i) => storeCreditPrismaToDomain(i));
  }

  async findManyPaginated(
    tenantId: string,
    params: FindManyStoreCreditsParams,
  ): Promise<FindManyStoreCreditsResult> {
    const { page, limit, customerId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (customerId) {
      where.customerId = customerId;
    }

    const [storeCredits, total] = await Promise.all([
      prisma.storeCredit.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.storeCredit.count({ where: where as never }),
    ]);

    return {
      data: storeCredits.map((sc) => storeCreditPrismaToDomain(sc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBalance(
    customerId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    const result = await prisma.storeCredit.aggregate({
      where: {
        customerId: customerId.toString(),
        tenantId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      _sum: {
        balance: true,
      },
    });

    return Number(result._sum.balance ?? 0);
  }

  async save(credit: StoreCredit): Promise<void> {
    await prisma.storeCredit.update({
      where: { id: credit.id.toString() },
      data: {
        balance: credit.balance,
        isActive: credit.isActive,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.storeCredit.deleteMany({
      where: {
        id: id.toString(),
        tenantId,
      },
    });
  }
}
