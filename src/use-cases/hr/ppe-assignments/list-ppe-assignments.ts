import type { PPEAssignment } from '@/entities/hr/ppe-assignment';
import type { PPEAssignmentsRepository } from '@/repositories/hr/ppe-assignments-repository';

export interface ListPPEAssignmentsRequest {
  tenantId: string;
  employeeId?: string;
  ppeItemId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListPPEAssignmentsResponse {
  assignments: PPEAssignment[];
  total: number;
}

export class ListPPEAssignmentsUseCase {
  constructor(private ppeAssignmentsRepository: PPEAssignmentsRepository) {}

  async execute(
    request: ListPPEAssignmentsRequest,
  ): Promise<ListPPEAssignmentsResponse> {
    const { tenantId, ...filters } = request;

    const { assignments, total } = await this.ppeAssignmentsRepository.findMany(
      tenantId,
      filters,
    );

    return { assignments, total };
  }
}
