import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface GetEmployeeByIdRequest {
  employeeId: string;
}

export interface GetEmployeeByIdResponse {
  employee: Employee;
}

export class GetEmployeeByIdUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: GetEmployeeByIdRequest,
  ): Promise<GetEmployeeByIdResponse> {
    const { employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    return {
      employee,
    };
  }
}
