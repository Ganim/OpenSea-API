import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeneratedEmploymentContract } from '@/entities/hr/generated-employment-contract';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { GeneratedEmploymentContractsRepository } from '@/repositories/hr/generated-employment-contracts-repository';

export interface ListEmployeeContractsRequest {
  tenantId: string;
  employeeId: string;
}

export interface ListEmployeeContractsResponse {
  contracts: GeneratedEmploymentContract[];
}

export class ListEmployeeContractsUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private generatedContractsRepository: GeneratedEmploymentContractsRepository,
  ) {}

  async execute(
    request: ListEmployeeContractsRequest,
  ): Promise<ListEmployeeContractsResponse> {
    const { tenantId, employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Employee not found');
    }

    const contracts =
      await this.generatedContractsRepository.findManyByEmployee(
        employee.id,
        tenantId,
      );

    return { contracts };
  }
}
