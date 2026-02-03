import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface DeleteEmployeeRequest {
  employeeId: string;
  tenantId: string;
}

export class DeleteEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(request: DeleteEmployeeRequest): Promise<void> {
    const { employeeId, tenantId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    await this.employeesRepository.delete(employee.id);
  }
}
