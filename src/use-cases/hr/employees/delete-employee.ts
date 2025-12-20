import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface DeleteEmployeeRequest {
  employeeId: string;
}

export class DeleteEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(request: DeleteEmployeeRequest): Promise<void> {
    const { employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    await this.employeesRepository.delete(employee.id);
  }
}
