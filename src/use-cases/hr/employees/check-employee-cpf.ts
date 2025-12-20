import { CPF } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface CheckEmployeeCpfRequest {
  cpf: string;
  includeDeleted?: boolean;
}

export interface CheckEmployeeCpfResponse {
  exists: boolean;
  employeeId: string | null;
  isDeleted: boolean;
}

export class CheckEmployeeCpfUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: CheckEmployeeCpfRequest,
  ): Promise<CheckEmployeeCpfResponse> {
    const { cpf, includeDeleted = false } = request;

    const employee = await this.employeesRepository.findByCpf(
      CPF.create(cpf),
      includeDeleted,
    );

    return {
      exists: !!employee,
      employeeId: employee ? employee.id.toString() : null,
      isDeleted: Boolean(employee?.deletedAt),
    };
  }
}
