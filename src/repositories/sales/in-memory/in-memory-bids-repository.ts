import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bid } from '@/entities/sales/bid';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidsRepository,
  FindManyBidsPaginatedParams,
} from '@/repositories/sales/bids-repository';

export class InMemoryBidsRepository implements BidsRepository {
  public items: Bid[] = [];

  async create(bid: Bid): Promise<void> {
    this.items.push(bid);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Bid | null> {
    return (
      this.items.find(
        (b) =>
          b.id.toString() === id.toString() &&
          b.tenantId.toString() === tenantId &&
          !b.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyBidsPaginatedParams,
  ): Promise<PaginatedResult<Bid>> {
    let filtered = this.items.filter(
      (b) => b.tenantId.toString() === params.tenantId && !b.isDeleted,
    );

    if (params.status) {
      filtered = filtered.filter((b) => b.status === params.status);
    }
    if (params.modality) {
      filtered = filtered.filter((b) => b.modality === params.modality);
    }
    if (params.organState) {
      filtered = filtered.filter((b) => b.organState === params.organState);
    }
    if (params.assignedToUserId) {
      filtered = filtered.filter(
        (b) => b.assignedToUserId?.toString() === params.assignedToUserId,
      );
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.editalNumber.toLowerCase().includes(search) ||
          b.object.toLowerCase().includes(search) ||
          b.organName.toLowerCase().includes(search),
      );
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

  async save(bid: Bid): Promise<void> {
    const index = this.items.findIndex(
      (b) => b.id.toString() === bid.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = bid;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const bid = this.items.find((b) => b.id.toString() === id.toString());
    if (bid) {
      bid.delete();
    }
  }
}
