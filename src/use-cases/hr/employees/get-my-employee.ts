import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface GetMyEmployeeRequest {
  tenantId: string;
  userId: string;
}

export interface GetMyEmployeeResponse {
  employee: Employee;
}

export class GetMyEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(request: GetMyEmployeeRequest): Promise<GetMyEmployeeResponse> {
    const { tenantId, userId } = request;

    const employee = await this.employeesRepository.findByUserId(
      new UniqueEntityID(userId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError(
        'No employee record found for this user.',
      );
    }

    return { employee };
  }
}
