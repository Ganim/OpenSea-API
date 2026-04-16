import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SalaryHistory } from '@/entities/hr/salary-history';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { SalaryHistoryRepository } from '@/repositories/hr/salary-history-repository';

export interface ListSalaryHistoryRequest {
  tenantId: string;
  employeeId: string;
}

export interface ListSalaryHistoryResponse {
  history: SalaryHistory[];
}

export class ListSalaryHistoryUseCase {
  constructor(
    private salaryHistoryRepository: SalaryHistoryRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: ListSalaryHistoryRequest,
  ): Promise<ListSalaryHistoryResponse> {
    const { tenantId, employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    const history = await this.salaryHistoryRepository.findManyByEmployee(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    return { history };
  }
}
