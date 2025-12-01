import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface TerminateEmployeeRequest {
  employeeId: string;
  terminationDate: Date;
  reason?: string;
}

export interface TerminateEmployeeResponse {
  employee: Employee;
}

export class TerminateEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: TerminateEmployeeRequest,
  ): Promise<TerminateEmployeeResponse> {
    const { employeeId, terminationDate, reason } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    // Check if employee is already terminated
    if (employee.status.value === 'TERMINATED') {
      throw new Error('Employee is already terminated');
    }

    // Update employee status and termination date
    const updatedEmployee = await this.employeesRepository.update({
      id: new UniqueEntityID(employeeId),
      status: EmployeeStatus.TERMINATED(),
      terminationDate,
      metadata: {
        ...employee.metadata,
        terminationReason: reason,
        terminatedAt: new Date().toISOString(),
      },
    });

    if (!updatedEmployee) {
      throw new Error('Failed to terminate employee');
    }

    return {
      employee: updatedEmployee,
    };
  }
}
