import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeRequest } from '@/entities/hr/employee-request';
import type { EmployeeRequestsRepository } from '@/repositories/hr/employee-requests-repository';

export interface ListMyRequestsInput {
  tenantId: string;
  employeeId: string;
  page: number;
  limit: number;
}

export interface ListMyRequestsOutput {
  employeeRequests: EmployeeRequest[];
  total: number;
}

export class ListMyRequestsUseCase {
  constructor(private employeeRequestsRepository: EmployeeRequestsRepository) {}

  async execute(input: ListMyRequestsInput): Promise<ListMyRequestsOutput> {
    const { tenantId, employeeId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { employeeRequests, total } =
      await this.employeeRequestsRepository.findManyByEmployee(
        new UniqueEntityID(employeeId),
        tenantId,
        skip,
        limit,
      );

    return { employeeRequests, total };
  }
}
