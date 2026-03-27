import type { EmployeeRequest } from '@/entities/hr/employee-request';
import type { EmployeeRequestsRepository } from '@/repositories/hr/employee-requests-repository';

export interface ListPendingApprovalsInput {
  tenantId: string;
  approverEmployeeId: string;
  page: number;
  limit: number;
}

export interface ListPendingApprovalsOutput {
  employeeRequests: EmployeeRequest[];
  total: number;
}

export class ListPendingApprovalsUseCase {
  constructor(
    private employeeRequestsRepository: EmployeeRequestsRepository,
  ) {}

  async execute(
    input: ListPendingApprovalsInput,
  ): Promise<ListPendingApprovalsOutput> {
    const { tenantId, approverEmployeeId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { employeeRequests, total } =
      await this.employeeRequestsRepository.findManyPendingByApprover(
        [approverEmployeeId],
        tenantId,
        skip,
        limit,
      );

    return { employeeRequests, total };
  }
}
