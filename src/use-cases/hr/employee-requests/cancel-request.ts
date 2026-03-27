import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeRequest } from '@/entities/hr/employee-request';
import type { EmployeeRequestsRepository } from '@/repositories/hr/employee-requests-repository';

export interface CancelRequestInput {
  tenantId: string;
  requestId: string;
  employeeId: string;
}

export interface CancelRequestOutput {
  employeeRequest: EmployeeRequest;
}

export class CancelRequestUseCase {
  constructor(
    private employeeRequestsRepository: EmployeeRequestsRepository,
  ) {}

  async execute(input: CancelRequestInput): Promise<CancelRequestOutput> {
    const { tenantId, requestId, employeeId } = input;

    const employeeRequest =
      await this.employeeRequestsRepository.findById(
        new UniqueEntityID(requestId),
        tenantId,
      );

    if (!employeeRequest) {
      throw new ResourceNotFoundError('Employee request not found');
    }

    // Only the owner can cancel their request
    if (employeeRequest.employeeId.toString() !== employeeId) {
      throw new BadRequestError('You can only cancel your own requests');
    }

    if (!employeeRequest.isPending()) {
      throw new BadRequestError('Only pending requests can be cancelled');
    }

    employeeRequest.cancel();
    await this.employeeRequestsRepository.save(employeeRequest);

    return { employeeRequest };
  }
}
