import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface SetEmployeeOnLeaveRequest {
  tenantId: string;
  employeeId: string;
  reason: string;
}

export interface SetEmployeeOnLeaveResponse {
  employee: Employee;
}

export class SetEmployeeOnLeaveUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: SetEmployeeOnLeaveRequest,
  ): Promise<SetEmployeeOnLeaveResponse> {
    const { tenantId, employeeId, reason } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    if (!employee.status.isActive()) {
      throw new BadRequestError(
        'Apenas funcionários ativos podem ser colocados em licença',
      );
    }

    const updatedEmployee = await this.employeesRepository.update({
      id: new UniqueEntityID(employeeId),
      status: EmployeeStatus.ON_LEAVE(),
      metadata: {
        ...employee.metadata,
        leaveReason: reason,
        leaveStartedAt: new Date().toISOString(),
      },
    });

    if (!updatedEmployee) {
      throw new BadRequestError('Falha ao registrar licença do funcionário');
    }

    return { employee: updatedEmployee };
  }
}
