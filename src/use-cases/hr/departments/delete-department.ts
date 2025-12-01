import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface DeleteDepartmentRequest {
  id: string;
}

export interface DeleteDepartmentResponse {
  success: boolean;
}

export class DeleteDepartmentUseCase {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  async execute(
    request: DeleteDepartmentRequest,
  ): Promise<DeleteDepartmentResponse> {
    const { id } = request;
    const departmentId = new UniqueEntityID(id);

    const department = await this.departmentsRepository.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Check if department has children
    const hasChildren =
      await this.departmentsRepository.hasChildren(departmentId);
    if (hasChildren) {
      throw new Error('Cannot delete department with child departments');
    }

    // Check if department has employees
    const hasEmployees =
      await this.departmentsRepository.hasEmployees(departmentId);
    if (hasEmployees) {
      throw new Error('Cannot delete department with employees');
    }

    await this.departmentsRepository.delete(departmentId);

    return { success: true };
  }
}
