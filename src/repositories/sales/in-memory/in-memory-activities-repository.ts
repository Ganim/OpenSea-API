import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Activity } from '@/entities/sales/activity';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  ActivitiesRepository,
  CreateActivitySchema,
  FindManyActivitiesOptions,
  UpdateActivitySchema,
} from '../activities-repository';

export class InMemoryActivitiesRepository implements ActivitiesRepository {
  public items: Activity[] = [];

  private paginate(
    items: Activity[],
    params: PaginationParams,
  ): PaginatedResult<Activity> {
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

  private activeByTenant(tenantId: string): Activity[] {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async create(data: CreateActivitySchema): Promise<Activity> {
    const activity = Activity.create({
      tenantId: new UniqueEntityID(data.tenantId),
      type: data.type,
      contactId: data.contactId
        ? new UniqueEntityID(data.contactId)
        : undefined,
      customerId: data.customerId
        ? new UniqueEntityID(data.customerId)
        : undefined,
      dealId: data.dealId ? new UniqueEntityID(data.dealId) : undefined,
      title: data.title,
      description: data.description,
      performedByUserId: data.performedByUserId
        ? new UniqueEntityID(data.performedByUserId)
        : undefined,
      performedAt: data.performedAt,
      dueAt: data.dueAt,
      completedAt: data.completedAt,
      duration: data.duration,
      outcome: data.outcome,
      metadata: data.metadata,
    });

    this.items.push(activity);
    return activity;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Activity | null> {
    const activity = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return activity ?? null;
  }

  async findManyPaginated(
    options: FindManyActivitiesOptions,
  ): Promise<PaginatedResult<Activity>> {
    let filtered = this.activeByTenant(options.tenantId);

    if (options.contactId) {
      filtered = filtered.filter(
        (a) => a.contactId?.toString() === options.contactId,
      );
    }

    if (options.customerId) {
      filtered = filtered.filter(
        (a) => a.customerId?.toString() === options.customerId,
      );
    }

    if (options.dealId) {
      filtered = filtered.filter(
        (a) => a.dealId?.toString() === options.dealId,
      );
    }

    if (options.type) {
      filtered = filtered.filter((a) => a.type === options.type);
    }

    const sortBy = options.sortBy ?? 'performedAt';
    const multiplier = options.sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const dateA =
        sortBy === 'performedAt'
          ? a.performedAt.getTime()
          : a.createdAt.getTime();
      const dateB =
        sortBy === 'performedAt'
          ? b.performedAt.getTime()
          : b.createdAt.getTime();
      return multiplier * (dateA - dateB);
    });

    return this.paginate(filtered, options);
  }

  async update(data: UpdateActivitySchema): Promise<Activity | null> {
    const activity = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!activity) return null;

    if (data.type !== undefined) activity.type = data.type;
    if (data.title !== undefined) activity.title = data.title;
    if (data.description !== undefined) activity.description = data.description;
    if (data.performedAt !== undefined) activity.performedAt = data.performedAt;
    if (data.dueAt !== undefined) activity.dueAt = data.dueAt;
    if (data.completedAt !== undefined) activity.completedAt = data.completedAt;
    if (data.duration !== undefined) activity.duration = data.duration;
    if (data.outcome !== undefined) activity.outcome = data.outcome;
    if (data.metadata !== undefined) activity.metadata = data.metadata;

    return activity;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const activity = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (activity) {
      activity.delete();
    }
  }

  async count(tenantId: string): Promise<number> {
    return this.activeByTenant(tenantId).length;
  }
}
