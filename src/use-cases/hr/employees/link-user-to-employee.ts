import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface LinkUserToEmployeeRequest {
  tenantId: string;
  employeeId: string;
  userId: string;
}

export interface LinkUserToEmployeeResponse {
  employee: Employee;
}

export class LinkUserToEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: LinkUserToEmployeeRequest,
  ): Promise<LinkUserToEmployeeResponse> {
    const { tenantId, employeeId, userId } = request;

    // Find the employee
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    // Check if employee already has a user linked
    if (employee.userId) {
      throw new Error('Employee already has a user linked');
    }

    // Check if user is already linked to another employee
    const existingEmployeeWithUser =
      await this.employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

    if (existingEmployeeWithUser) {
      throw new Error('User is already linked to another employee');
    }

    // Update employee with user link
    const updatedEmployee = await this.employeesRepository.update({
      id: new UniqueEntityID(employeeId),
      userId: new UniqueEntityID(userId),
    });

    if (!updatedEmployee) {
      throw new Error('Failed to link user to employee');
    }

    return {
      employee: updatedEmployee,
    };
  }
}
