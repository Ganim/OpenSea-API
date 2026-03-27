import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeRequest } from '@/entities/hr/employee-request';
import type { EmployeeRequestsRepository } from '@/repositories/hr/employee-requests-repository';

export interface RejectRequestInput {
  tenantId: string;
  requestId: string;
  approverEmployeeId: string;
  rejectionReason: string;
}

export interface RejectRequestOutput {
  employeeRequest: EmployeeRequest;
}

export class RejectRequestUseCase {
  constructor(
    private employeeRequestsRepository: EmployeeRequestsRepository,
  ) {}

  async execute(input: RejectRequestInput): Promise<RejectRequestOutput> {
    const { tenantId, requestId, approverEmployeeId, rejectionReason } = input;

    const employeeRequest =
      await this.employeeRequestsRepository.findById(
        new UniqueEntityID(requestId),
        tenantId,
      );

    if (!employeeRequest) {
      throw new ResourceNotFoundError('Employee request not found');
    }

    if (!employeeRequest.isPending()) {
      throw new BadRequestError('Only pending requests can be rejected');
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestError('Rejection reason is required');
    }

    employeeRequest.reject(
      new UniqueEntityID(approverEmployeeId),
      rejectionReason,
    );
    await this.employeeRequestsRepository.save(employeeRequest);

    return { employeeRequest };
  }
}
