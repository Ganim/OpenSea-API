import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface SuspendEmployeeRequest {
  tenantId: string;
  employeeId: string;
  reason: string;
}

export interface SuspendEmployeeResponse {
  employee: Employee;
}

export class SuspendEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: SuspendEmployeeRequest,
  ): Promise<SuspendEmployeeResponse> {
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
        'Apenas funcionários ativos podem ser suspensos',
      );
    }

    const updatedEmployee = await this.employeesRepository.update({
      id: new UniqueEntityID(employeeId),
      status: EmployeeStatus.SUSPENDED(),
      metadata: {
        ...employee.metadata,
        suspensionReason: reason,
        suspendedAt: new Date().toISOString(),
      },
    });

    if (!updatedEmployee) {
      throw new BadRequestError('Falha ao suspender funcionário');
    }

    return { employee: updatedEmployee };
  }
}
