import type { Activity, ActivityType } from '@/entities/sales/activity';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';

interface ListActivitiesUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  contactId?: string;
  customerId?: string;
  dealId?: string;
  type?: ActivityType;
  sortBy?: 'performedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface ListActivitiesUseCaseResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListActivitiesUseCase {
  constructor(private activitiesRepository: ActivitiesRepository) {}

  async execute(
    request: ListActivitiesUseCaseRequest,
  ): Promise<ListActivitiesUseCaseResponse> {
    const result: PaginatedResult<Activity> =
      await this.activitiesRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        contactId: request.contactId,
        customerId: request.customerId,
        dealId: request.dealId,
        type: request.type,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      activities: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
