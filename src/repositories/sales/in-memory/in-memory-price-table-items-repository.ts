import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PriceTableItem } from '@/entities/sales/price-table-item';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CreatePriceTableItemSchema,
  FindManyPriceTableItemsParams,
  PriceTableItemsRepository,
} from '@/repositories/sales/price-table-items-repository';

export class InMemoryPriceTableItemsRepository
  implements PriceTableItemsRepository
{
  public items: PriceTableItem[] = [];

  async create(data: CreatePriceTableItemSchema): Promise<PriceTableItem> {
    const item = PriceTableItem.create({
      priceTableId: new UniqueEntityID(data.priceTableId),
      tenantId: new UniqueEntityID(data.tenantId),
      variantId: new UniqueEntityID(data.variantId),
      price: data.price,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      costPrice: data.costPrice,
      marginPercent: data.marginPercent,
    });

    this.items.push(item);
    return item;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PriceTableItem | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id.toString() &&
          item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByTableAndVariant(
    priceTableId: string,
    variantId: string,
    tenantId: string,
    minQuantity?: number,
  ): Promise<PriceTableItem | null> {
    return (
      this.items.find(
        (item) =>
          item.priceTableId.toString() === priceTableId &&
          item.variantId.toString() === variantId &&
          item.tenantId.toString() === tenantId &&
          (minQuantity === undefined || item.minQuantity === minQuantity),
      ) ?? null
    );
  }

  async findBestForVariantInTable(
    priceTableId: string,
    variantId: string,
    quantity: number,
  ): Promise<PriceTableItem | null> {
    const matching = this.items
      .filter(
        (item) =>
          item.priceTableId.toString() === priceTableId &&
          item.variantId.toString() === variantId &&
          item.minQuantity <= quantity &&
          (item.maxQuantity === undefined || item.maxQuantity >= quantity),
      )
      .sort((a, b) => b.minQuantity - a.minQuantity);

    return matching[0] ?? null;
  }

  async findManyByTable(
    params: FindManyPriceTableItemsParams,
  ): Promise<PaginatedResult<PriceTableItem>> {
    const filtered = this.items.filter(
      (item) =>
        item.priceTableId.toString() === params.priceTableId &&
        item.tenantId.toString() === params.tenantId,
    );

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async upsert(data: CreatePriceTableItemSchema): Promise<PriceTableItem> {
    const existing = await this.findByTableAndVariant(
      data.priceTableId,
      data.variantId,
      data.tenantId,
      data.minQuantity ?? 1,
    );

    if (existing) {
      existing.price = data.price;
      if (data.maxQuantity !== undefined)
        existing.maxQuantity = data.maxQuantity;
      if (data.costPrice !== undefined) existing.costPrice = data.costPrice;
      if (data.marginPercent !== undefined)
        existing.marginPercent = data.marginPercent;
      return existing;
    }

    return this.create(data);
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

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.toString() === id.toString() &&
        item.tenantId.toString() === tenantId,
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
