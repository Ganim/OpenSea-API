import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidItem } from '@/entities/sales/bid-item';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidItemsRepository,
  FindManyBidItemsPaginatedParams,
} from '../bid-items-repository';
import type {
  BidItemStatus as PrismaBidItemStatus,
  BidQuotaType as PrismaBidQuotaType,
} from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): BidItem {
  return BidItem.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      bidId: new UniqueEntityID(data.bidId as string),
      itemNumber: data.itemNumber as number,
      lotNumber: (data.lotNumber as number) ?? undefined,
      lotDescription: (data.lotDescription as string) ?? undefined,
      description: data.description as string,
      quantity: Number(data.quantity),
      unit: data.unit as string,
      estimatedUnitPrice: data.estimatedUnitPrice
        ? Number(data.estimatedUnitPrice)
        : undefined,
      ourUnitPrice: data.ourUnitPrice ? Number(data.ourUnitPrice) : undefined,
      finalUnitPrice: data.finalUnitPrice
        ? Number(data.finalUnitPrice)
        : undefined,
      status: data.status as BidItem['status'],
      variantId: data.variantId
        ? new UniqueEntityID(data.variantId as string)
        : undefined,
      matchConfidence: data.matchConfidence
        ? Number(data.matchConfidence)
        : undefined,
      quotaType: (data.quotaType as BidItem['quotaType']) ?? undefined,
      notes: (data.notes as string) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidItemsRepository implements BidItemsRepository {
  async create(item: BidItem): Promise<void> {
    await prisma.bidItem.create({
      data: {
        id: item.id.toString(),
        tenantId: item.tenantId.toString(),
        bidId: item.bidId.toString(),
        itemNumber: item.itemNumber,
        lotNumber: item.lotNumber,
        lotDescription: item.lotDescription,
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unit: item.unit,
        estimatedUnitPrice:
          item.estimatedUnitPrice != null
            ? new Prisma.Decimal(item.estimatedUnitPrice)
            : undefined,
        ourUnitPrice:
          item.ourUnitPrice != null
            ? new Prisma.Decimal(item.ourUnitPrice)
            : undefined,
        finalUnitPrice:
          item.finalUnitPrice != null
            ? new Prisma.Decimal(item.finalUnitPrice)
            : undefined,
        status: item.status as PrismaBidItemStatus,
        variantId: item.variantId?.toString(),
        matchConfidence:
          item.matchConfidence != null
            ? new Prisma.Decimal(item.matchConfidence)
            : undefined,
        quotaType: item.quotaType as PrismaBidQuotaType | undefined,
        notes: item.notes,
        createdAt: item.createdAt,
      },
    });
  }

  async createMany(items: BidItem[]): Promise<void> {
    if (items.length === 0) return;
    await prisma.bidItem.createMany({
      data: items.map((item) => ({
        id: item.id.toString(),
        tenantId: item.tenantId.toString(),
        bidId: item.bidId.toString(),
        itemNumber: item.itemNumber,
        lotNumber: item.lotNumber,
        lotDescription: item.lotDescription,
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unit: item.unit,
        estimatedUnitPrice:
          item.estimatedUnitPrice != null
            ? new Prisma.Decimal(item.estimatedUnitPrice)
            : undefined,
        ourUnitPrice:
          item.ourUnitPrice != null
            ? new Prisma.Decimal(item.ourUnitPrice)
            : undefined,
        status: item.status as PrismaBidItemStatus,
        variantId: item.variantId?.toString(),
        quotaType: item.quotaType as PrismaBidQuotaType | undefined,
        notes: item.notes,
        createdAt: item.createdAt,
      })),
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidItem | null> {
    const data = await prisma.bidItem.findFirst({
      where: { id: id.toString(), tenantId },
    });
    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyByBidId(
    params: FindManyBidItemsPaginatedParams,
  ): Promise<PaginatedResult<BidItem>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      bidId: params.bidId,
    };
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      prisma.bidItem.findMany({
        where: where as Prisma.BidItemWhereInput,
        orderBy: { itemNumber: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bidItem.count({ where: where as Prisma.BidItemWhereInput }),
    ]);

    return {
      data: data.map((d) =>
        mapToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(item: BidItem): Promise<void> {
    await prisma.bidItem.update({
      where: { id: item.id.toString() },
      data: {
        ourUnitPrice:
          item.ourUnitPrice != null
            ? new Prisma.Decimal(item.ourUnitPrice)
            : null,
        finalUnitPrice:
          item.finalUnitPrice != null
            ? new Prisma.Decimal(item.finalUnitPrice)
            : null,
        status: item.status as PrismaBidItemStatus,
        notes: item.notes,
      },
    });
  }

  async deleteByBidId(bidId: string, tenantId: string): Promise<void> {
    await prisma.bidItem.deleteMany({
      where: { bidId, tenantId },
    });
  }
}
