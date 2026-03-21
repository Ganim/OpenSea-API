import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  DealsRepository,
  FindManyDealsPaginatedParams,
} from '@/repositories/sales/deals-repository';

export class InMemoryDealsRepository implements DealsRepository {
  public items: Deal[] = [];

  async create(deal: Deal): Promise<void> {
    this.items.push(deal);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Deal | null> {
    return (
      this.items.find(
        (d) =>
          d.id.toString() === id.toString() &&
          d.tenantId.toString() === tenantId &&
          !d.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyDealsPaginatedParams,
  ): Promise<PaginatedResult<Deal>> {
    let filtered = this.items.filter(
      (d) => d.tenantId.toString() === params.tenantId && !d.isDeleted,
    );

    if (params.pipelineId) {
      filtered = filtered.filter(
        (d) => d.pipelineId.toString() === params.pipelineId,
      );
    }
    if (params.stageId) {
      filtered = filtered.filter(
        (d) => d.stageId.toString() === params.stageId,
      );
    }
    if (params.status) {
      filtered = filtered.filter((d) => d.status === params.status);
    }
    if (params.priority) {
      filtered = filtered.filter((d) => d.priority === params.priority);
    }
    if (params.customerId) {
      filtered = filtered.filter(
        (d) => d.customerId.toString() === params.customerId,
      );
    }
    if (params.assignedToUserId) {
      filtered = filtered.filter(
        (d) => d.assignedToUserId?.toString() === params.assignedToUserId,
      );
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.title.toLowerCase().includes(search),
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

  async findManyByStage(stageId: string, tenantId: string): Promise<Deal[]> {
    return this.items.filter(
      (d) =>
        d.stageId.toString() === stageId &&
        d.tenantId.toString() === tenantId &&
        !d.isDeleted,
    );
  }

  async save(deal: Deal): Promise<void> {
    const index = this.items.findIndex(
      (d) => d.id.toString() === deal.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = deal;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const deal = this.items.find((d) => d.id.toString() === id.toString());
    if (deal) {
      deal.delete();
    }
  }
}
