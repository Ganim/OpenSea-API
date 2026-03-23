import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PriceTableItem } from '@/entities/sales/price-table-item';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CreatePriceTableItemSchema,
  FindManyPriceTableItemsParams,
  PriceTableItemsRepository,
} from '../price-table-items-repository';

function mapToDomain(data: Record<string, unknown>): PriceTableItem {
  return PriceTableItem.create(
    {
      priceTableId: new UniqueEntityID(data.priceTableId as string),
      tenantId: new UniqueEntityID(data.tenantId as string),
      variantId: new UniqueEntityID(data.variantId as string),
      price: Number(data.price),
      minQuantity: data.minQuantity as number,
      maxQuantity: (data.maxQuantity as number) ?? undefined,
      costPrice: data.costPrice ? Number(data.costPrice) : undefined,
      marginPercent: data.marginPercent
        ? Number(data.marginPercent)
        : undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaPriceTableItemsRepository
  implements PriceTableItemsRepository
{
  async create(data: CreatePriceTableItemSchema): Promise<PriceTableItem> {
    const result = await prisma.priceTableItem.create({
      data: {
        priceTableId: data.priceTableId,
        tenantId: data.tenantId,
        variantId: data.variantId,
        price: data.price,
        minQuantity: data.minQuantity ?? 1,
        maxQuantity: data.maxQuantity,
        costPrice: data.costPrice,
        marginPercent: data.marginPercent,
      },
    });

    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PriceTableItem | null> {
    const result = await prisma.priceTableItem.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findByTableAndVariant(
    priceTableId: string,
    variantId: string,
    tenantId: string,
    minQuantity?: number,
  ): Promise<PriceTableItem | null> {
    const where: Record<string, unknown> = {
      priceTableId,
      variantId,
      tenantId,
    };
    if (minQuantity !== undefined) {
      where.minQuantity = minQuantity;
    }

    const result = await prisma.priceTableItem.findFirst({
      where: where as never,
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findBestForVariantInTable(
    priceTableId: string,
    variantId: string,
    quantity: number,
  ): Promise<PriceTableItem | null> {
    const result = await prisma.priceTableItem.findFirst({
      where: {
        priceTableId,
        variantId,
        minQuantity: { lte: quantity },
        OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }],
      },
      orderBy: { minQuantity: 'desc' },
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findManyByTable(
    params: FindManyPriceTableItemsParams,
  ): Promise<PaginatedResult<PriceTableItem>> {
    const where: Record<string, unknown> = {
      priceTableId: params.priceTableId,
      tenantId: params.tenantId,
    };

    const [results, total] = await Promise.all([
      prisma.priceTableItem.findMany({
        where: where as never,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      prisma.priceTableItem.count({
        where: where as never,
      }),
    ]);

    return {
      data: results.map((r) =>
        mapToDomain(r as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async upsert(data: CreatePriceTableItemSchema): Promise<PriceTableItem> {
    const minQty = data.minQuantity ?? 1;

    const result = await prisma.priceTableItem.upsert({
      where: {
        priceTableId_variantId_minQuantity: {
          priceTableId: data.priceTableId,
          variantId: data.variantId,
          minQuantity: minQty,
        },
      },
      update: {
        price: data.price,
        maxQuantity: data.maxQuantity,
        costPrice: data.costPrice,
        marginPercent: data.marginPercent,
      },
      create: {
        priceTableId: data.priceTableId,
        tenantId: data.tenantId,
        variantId: data.variantId,
        price: data.price,
        minQuantity: minQty,
        maxQuantity: data.maxQuantity,
        costPrice: data.costPrice,
        marginPercent: data.marginPercent,
      },
    });

    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async bulkCreate(
    items: CreatePriceTableItemSchema[],
  ): Promise<PriceTableItem[]> {
    const created: PriceTableItem[] = [];
    for (const data of items) {
      const item = await this.upsert(data);
      created.push(item);
    }
    return created;
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.priceTableItem.delete({
      where: { id: id.toString() },
    });
  }
}
