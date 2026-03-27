import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeRequest } from '@/entities/hr/employee-request';
import type { EmployeeRequestsRepository } from '@/repositories/hr/employee-requests-repository';

export interface GetRequestInput {
  tenantId: string;
  requestId: string;
  employeeId: string;
}

export interface GetRequestOutput {
  employeeRequest: EmployeeRequest;
}

export class GetRequestUseCase {
  constructor(
    private employeeRequestsRepository: EmployeeRequestsRepository,
  ) {}

  async execute(input: GetRequestInput): Promise<GetRequestOutput> {
    const { tenantId, requestId, employeeId } = input;

    const employeeRequest =
      await this.employeeRequestsRepository.findById(
        new UniqueEntityID(requestId),
        tenantId,
      );

    if (!employeeRequest) {
      throw new ResourceNotFoundError('Employee request not found');
    }

    // Ensure the employee can only see their own requests
    if (employeeRequest.employeeId.toString() !== employeeId) {
      throw new ResourceNotFoundError('Employee request not found');
    }

    return { employeeRequest };
  }
}
