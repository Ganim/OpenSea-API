import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidContract } from '@/entities/sales/bid-contract';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidContractsRepository,
  FindManyBidContractsPaginatedParams,
} from '@/repositories/sales/bid-contracts-repository';

export class InMemoryBidContractsRepository implements BidContractsRepository {
  public items: BidContract[] = [];

  async create(contract: BidContract): Promise<void> {
    this.items.push(contract);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<BidContract | null> {
    return (
      this.items.find(
        (c) =>
          c.id.toString() === id.toString() &&
          c.tenantId.toString() === tenantId &&
          !c.isDeleted,
      ) ?? null
    );
  }

  async findByNumber(contractNumber: string, tenantId: string): Promise<BidContract | null> {
    return (
      this.items.find(
        (c) =>
          c.contractNumber === contractNumber &&
          c.tenantId.toString() === tenantId &&
          !c.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyBidContractsPaginatedParams,
  ): Promise<PaginatedResult<BidContract>> {
    let filtered = this.items.filter(
      (c) => c.tenantId.toString() === params.tenantId && !c.isDeleted,
    );

    if (params.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    if (params.bidId) {
      filtered = filtered.filter((c) => c.bidId.toString() === params.bidId);
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

  async save(contract: BidContract): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === contract.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = contract;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const contract = this.items.find((c) => c.id.toString() === id.toString());
    if (contract) {
      contract.delete();
    }
  }
}
