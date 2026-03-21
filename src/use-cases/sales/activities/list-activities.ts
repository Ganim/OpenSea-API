import type { Activity } from '@/entities/sales/activity';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';

interface ListActivitiesUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  dealId?: string;
  contactId?: string;
  type?: string;
  status?: string;
  userId?: string;
  sortBy?: string;
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
        search: request.search,
        dealId: request.dealId,
        contactId: request.contactId,
        type: request.type,
        status: request.status,
        userId: request.userId,
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
