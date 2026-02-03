import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface GetEmployeeByIdRequest {
  employeeId: string;
  tenantId: string;
}

export interface GetEmployeeByIdResponse {
  employee: Employee;
}

export class GetEmployeeByIdUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: GetEmployeeByIdRequest,
  ): Promise<GetEmployeeByIdResponse> {
    const { employeeId, tenantId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    return {
      employee,
    };
  }
}
