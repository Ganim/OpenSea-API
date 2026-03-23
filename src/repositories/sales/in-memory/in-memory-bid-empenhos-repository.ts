import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidEmpenho } from '@/entities/sales/bid-empenho';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidEmpenhosRepository,
  FindManyBidEmpenhosPaginatedParams,
} from '@/repositories/sales/bid-empenhos-repository';

export class InMemoryBidEmpenhosRepository implements BidEmpenhosRepository {
  public items: BidEmpenho[] = [];

  async create(empenho: BidEmpenho): Promise<void> {
    this.items.push(empenho);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidEmpenho | null> {
    return (
      this.items.find(
        (e) =>
          e.id.toString() === id.toString() &&
          e.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByNumber(
    empenhoNumber: string,
    tenantId: string,
  ): Promise<BidEmpenho | null> {
    return (
      this.items.find(
        (e) =>
          e.empenhoNumber === empenhoNumber &&
          e.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByContractId(
    params: FindManyBidEmpenhosPaginatedParams,
  ): Promise<PaginatedResult<BidEmpenho>> {
    let filtered = this.items.filter(
      (e) =>
        e.tenantId.toString() === params.tenantId &&
        e.contractId.toString() === params.contractId,
    );

    if (params.status) {
      filtered = filtered.filter((e) => e.status === params.status);
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

  async save(empenho: BidEmpenho): Promise<void> {
    const index = this.items.findIndex(
      (e) => e.id.toString() === empenho.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = empenho;
    }
  }
}
