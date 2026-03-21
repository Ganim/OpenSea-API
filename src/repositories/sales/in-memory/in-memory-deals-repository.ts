import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  CreateDealSchema,
  DealsRepository,
  FindManyDealsOptions,
  UpdateDealSchema,
} from '../deals-repository';

export class InMemoryDealsRepository implements DealsRepository {
  public items: Deal[] = [];

  private paginate(
    items: Deal[],
    params: PaginationParams,
  ): PaginatedResult<Deal> {
    const total = items.length;
    const start = (params.page - 1) * params.limit;
    return {
      data: items.slice(start, start + params.limit),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  private activeByTenant(tenantId: string): Deal[] {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async create(data: CreateDealSchema): Promise<Deal> {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      customerId: new UniqueEntityID(data.customerId),
      pipelineId: new UniqueEntityID(data.pipelineId),
      stageId: new UniqueEntityID(data.stageId),
      value: data.value,
      currency: data.currency,
      expectedCloseDate: data.expectedCloseDate,
      probability: data.probability,
      status: data.status,
      lostReason: data.lostReason,
      assignedToUserId: data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId)
        : undefined,
      tags: data.tags,
      customFields: data.customFields,
      previousDealId: data.previousDealId
        ? new UniqueEntityID(data.previousDealId)
        : undefined,
    });

    this.items.push(deal);
    return deal;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Deal | null> {
    const deal = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return deal ?? null;
  }

  async findManyPaginated(
    options: FindManyDealsOptions,
  ): Promise<PaginatedResult<Deal>> {
    let filtered = this.activeByTenant(options.tenantId);

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.title.toLowerCase().includes(searchLower),
      );
    }

    if (options.customerId) {
      filtered = filtered.filter(
        (d) => d.customerId.toString() === options.customerId,
      );
    }

    if (options.pipelineId) {
      filtered = filtered.filter(
        (d) => d.pipelineId.toString() === options.pipelineId,
      );
    }

    if (options.stageId) {
      filtered = filtered.filter(
        (d) => d.stageId.toString() === options.stageId,
      );
    }

    if (options.status) {
      filtered = filtered.filter((d) => d.status === options.status);
    }

    if (options.assignedToUserId) {
      filtered = filtered.filter(
        (d) => d.assignedToUserId?.toString() === options.assignedToUserId,
      );
    }

    if (options.sortBy) {
      const multiplier = options.sortOrder === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        switch (options.sortBy) {
          case 'title':
            return multiplier * a.title.localeCompare(b.title);
          case 'value':
            return multiplier * ((a.value ?? 0) - (b.value ?? 0));
          case 'createdAt':
          case 'updatedAt':
          case 'expectedCloseDate': {
            const dateA = a[options.sortBy!]?.getTime() ?? 0;
            const dateB = b[options.sortBy!]?.getTime() ?? 0;
            return multiplier * (dateA - dateB);
          }
          default:
            return 0;
        }
      });
    }

    return this.paginate(filtered, options);
  }

  async update(data: UpdateDealSchema): Promise<Deal | null> {
    const deal = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!deal) return null;

    if (data.title !== undefined) deal.title = data.title;
    if (data.value !== undefined) deal.value = data.value;
    if (data.currency !== undefined) deal.currency = data.currency;
    if (data.expectedCloseDate !== undefined)
      deal.expectedCloseDate = data.expectedCloseDate;
    if (data.probability !== undefined) deal.probability = data.probability;
    if (data.status !== undefined) deal.status = data.status;
    if (data.lostReason !== undefined) deal.lostReason = data.lostReason;
    if (data.assignedToUserId !== undefined)
      deal.assignedToUserId = data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId)
        : undefined;
    if (data.tags !== undefined) deal.tags = data.tags;
    if (data.customFields !== undefined)
      deal.customFields = data.customFields;

    return deal;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const deal = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (deal) {
      deal.delete();
    }
  }

  async count(tenantId: string): Promise<number> {
    return this.activeByTenant(tenantId).length;
  }

  async changeStage(
    id: UniqueEntityID,
    tenantId: string,
    stageId: UniqueEntityID,
  ): Promise<Deal | null> {
    const deal = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (!deal) return null;

    deal.stageId = stageId;
    deal.stageEnteredAt = new Date();

    return deal;
  }
}
