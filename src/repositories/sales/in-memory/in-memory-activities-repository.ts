import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Activity } from '@/entities/sales/activity';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  ActivitiesRepository,
  FindManyActivitiesPaginatedParams,
} from '@/repositories/sales/activities-repository';

export class InMemoryActivitiesRepository implements ActivitiesRepository {
  public items: Activity[] = [];

  async create(activity: Activity): Promise<void> {
    this.items.push(activity);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Activity | null> {
    return (
      this.items.find(
        (a) =>
          a.id.toString() === id.toString() &&
          a.tenantId.toString() === tenantId &&
          !a.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyActivitiesPaginatedParams,
  ): Promise<PaginatedResult<Activity>> {
    let filtered = this.items.filter(
      (a) => a.tenantId.toString() === params.tenantId && !a.isDeleted,
    );

    if (params.dealId) {
      filtered = filtered.filter((a) => a.dealId?.toString() === params.dealId);
    }
    if (params.contactId) {
      filtered = filtered.filter(
        (a) => a.contactId?.toString() === params.contactId,
      );
    }
    if (params.type) {
      filtered = filtered.filter((a) => a.type === params.type);
    }
    if (params.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    if (params.userId) {
      filtered = filtered.filter((a) => a.userId.toString() === params.userId);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(search));
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

  async findManyByDeal(dealId: string, tenantId: string): Promise<Activity[]> {
    return this.items.filter(
      (a) =>
        a.dealId?.toString() === dealId &&
        a.tenantId.toString() === tenantId &&
        !a.isDeleted,
    );
  }

  async save(activity: Activity): Promise<void> {
    const index = this.items.findIndex(
      (a) => a.id.toString() === activity.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = activity;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const activity = this.items.find((a) => a.id.toString() === id.toString());
    if (activity) {
      activity.delete();
    }
  }
}
