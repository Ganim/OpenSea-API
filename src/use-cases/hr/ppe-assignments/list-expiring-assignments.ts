import type { PPEAssignment } from '@/entities/hr/ppe-assignment';
import type { PPEAssignmentsRepository } from '@/repositories/hr/ppe-assignments-repository';

export interface ListExpiringAssignmentsRequest {
  tenantId: string;
  daysAhead?: number;
  page?: number;
  perPage?: number;
}

export interface ListExpiringAssignmentsResponse {
  assignments: PPEAssignment[];
  total: number;
}

export class ListExpiringAssignmentsUseCase {
  constructor(
    private ppeAssignmentsRepository: PPEAssignmentsRepository,
  ) {}

  async execute(
    request: ListExpiringAssignmentsRequest,
  ): Promise<ListExpiringAssignmentsResponse> {
    const { tenantId, daysAhead = 30, ...paginationFilters } = request;

    const { assignments, total } =
      await this.ppeAssignmentsRepository.findExpiring(tenantId, {
        daysAhead,
        ...paginationFilters,
      });

    return { assignments, total };
  }
}
