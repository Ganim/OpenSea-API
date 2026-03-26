import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { DependantsRepository } from '@/repositories/hr/dependants-repository';

export interface ListDependantsRequest {
  tenantId: string;
  employeeId: string;
  page?: number;
  perPage?: number;
}

export interface ListDependantsResponse {
  dependants: EmployeeDependant[];
}

export class ListDependantsUseCase {
  constructor(private dependantsRepository: DependantsRepository) {}

  async execute(
    request: ListDependantsRequest,
  ): Promise<ListDependantsResponse> {
    const { tenantId, employeeId, page, perPage } = request;

    const dependants = await this.dependantsRepository.findMany(tenantId, {
      employeeId: new UniqueEntityID(employeeId),
      page,
      perPage,
    });

    return { dependants };
  }
}
