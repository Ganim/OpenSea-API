import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeRequest } from '@/entities/hr/employee-request';
import type { EmployeeRequestsRepository } from '@/repositories/hr/employee-requests-repository';

export interface ApproveRequestInput {
  tenantId: string;
  requestId: string;
  approverEmployeeId: string;
}

export interface ApproveRequestOutput {
  employeeRequest: EmployeeRequest;
}

export class ApproveRequestUseCase {
  constructor(
    private employeeRequestsRepository: EmployeeRequestsRepository,
  ) {}

  async execute(input: ApproveRequestInput): Promise<ApproveRequestOutput> {
    const { tenantId, requestId, approverEmployeeId } = input;

    const employeeRequest =
      await this.employeeRequestsRepository.findById(
        new UniqueEntityID(requestId),
        tenantId,
      );

    if (!employeeRequest) {
      throw new ResourceNotFoundError('Employee request not found');
    }

    if (!employeeRequest.isPending()) {
      throw new BadRequestError('Only pending requests can be approved');
    }

    // Prevent self-approval
    if (employeeRequest.employeeId.toString() === approverEmployeeId) {
      throw new BadRequestError('Cannot approve your own request');
    }

    employeeRequest.approve(new UniqueEntityID(approverEmployeeId));
    await this.employeeRequestsRepository.save(employeeRequest);

    return { employeeRequest };
  }
}
