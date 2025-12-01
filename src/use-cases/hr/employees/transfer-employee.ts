import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface TransferEmployeeRequest {
  employeeId: string;
  newDepartmentId?: string | null;
  newPositionId?: string | null;
  newSupervisorId?: string | null;
  newBaseSalary?: number;
  effectiveDate?: Date;
  reason?: string;
}

export interface TransferEmployeeResponse {
  employee: Employee;
}

export class TransferEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: TransferEmployeeRequest,
  ): Promise<TransferEmployeeResponse> {
    const {
      employeeId,
      newDepartmentId,
      newPositionId,
      newSupervisorId,
      newBaseSalary,
      effectiveDate = new Date(),
      reason,
    } = request;

    // Find the employee
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    // Check if employee is terminated
    if (employee.status.value === 'TERMINATED') {
      throw new Error('Cannot transfer a terminated employee');
    }

    // Build transfer history entry
    const transferHistory = Array.isArray(
      (employee.metadata as Record<string, unknown>)?.transferHistory,
    )
      ? ((employee.metadata as Record<string, unknown>)
          ?.transferHistory as unknown[])
      : [];
    const newTransferEntry = {
      date: effectiveDate.toISOString(),
      previousDepartmentId: employee.departmentId?.toString() || null,
      previousPositionId: employee.positionId?.toString() || null,
      previousSupervisorId: employee.supervisorId?.toString() || null,
      previousBaseSalary: employee.baseSalary,
      newDepartmentId: newDepartmentId || null,
      newPositionId: newPositionId || null,
      newSupervisorId: newSupervisorId || null,
      newBaseSalary: newBaseSalary || employee.baseSalary,
      reason,
    };

    // Update employee
    const updateData: Parameters<typeof this.employeesRepository.update>[0] = {
      id: new UniqueEntityID(employeeId),
      metadata: {
        ...employee.metadata,
        transferHistory: [...transferHistory, newTransferEntry],
        lastTransferDate: effectiveDate.toISOString(),
      },
    };

    if (newDepartmentId !== undefined) {
      updateData.departmentId = newDepartmentId
        ? new UniqueEntityID(newDepartmentId)
        : null;
    }

    if (newPositionId !== undefined) {
      updateData.positionId = newPositionId
        ? new UniqueEntityID(newPositionId)
        : null;
    }

    if (newSupervisorId !== undefined) {
      updateData.supervisorId = newSupervisorId
        ? new UniqueEntityID(newSupervisorId)
        : null;
    }

    if (newBaseSalary !== undefined) {
      updateData.baseSalary = newBaseSalary;
    }

    const updatedEmployee = await this.employeesRepository.update(updateData);

    if (!updatedEmployee) {
      throw new Error('Failed to transfer employee');
    }

    return {
      employee: updatedEmployee,
    };
  }
}
