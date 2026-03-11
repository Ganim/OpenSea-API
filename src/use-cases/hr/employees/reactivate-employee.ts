import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface ReactivateEmployeeRequest {
  tenantId: string;
  employeeId: string;
}

export interface ReactivateEmployeeResponse {
  employee: Employee;
}

export class ReactivateEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: ReactivateEmployeeRequest,
  ): Promise<ReactivateEmployeeResponse> {
    const { tenantId, employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    if (!employee.status.isSuspended() && !employee.status.isOnLeave()) {
      throw new BadRequestError(
        'Apenas funcionários suspensos ou em licença podem ser reativados',
      );
    }

    const updatedEmployee = await this.employeesRepository.update({
      id: new UniqueEntityID(employeeId),
      status: EmployeeStatus.ACTIVE(),
      metadata: {
        ...employee.metadata,
        reactivatedAt: new Date().toISOString(),
      },
    });

    if (!updatedEmployee) {
      throw new BadRequestError('Falha ao reativar funcionário');
    }

    return { employee: updatedEmployee };
  }
}
