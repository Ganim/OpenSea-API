import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidItem } from '@/entities/sales/bid-item';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidItemsRepository,
  FindManyBidItemsPaginatedParams,
} from '@/repositories/sales/bid-items-repository';

export class InMemoryBidItemsRepository implements BidItemsRepository {
  public items: BidItem[] = [];

  async create(item: BidItem): Promise<void> {
    this.items.push(item);
  }

  async createMany(items: BidItem[]): Promise<void> {
    this.items.push(...items);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidItem | null> {
    return (
      this.items.find(
        (i) =>
          i.id.toString() === id.toString() &&
          i.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByBidId(
    params: FindManyBidItemsPaginatedParams,
  ): Promise<PaginatedResult<BidItem>> {
    let filtered = this.items.filter(
      (i) =>
        i.tenantId.toString() === params.tenantId &&
        i.bidId.toString() === params.bidId,
    );

    if (params.status) {
      filtered = filtered.filter((i) => i.status === params.status);
    }

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

  async save(item: BidItem): Promise<void> {
    const index = this.items.findIndex(
      (i) => i.id.toString() === item.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = item;
    }
  }

  async deleteByBidId(bidId: string, _tenantId: string): Promise<void> {
    this.items = this.items.filter((i) => i.bidId.toString() !== bidId);
  }
}
