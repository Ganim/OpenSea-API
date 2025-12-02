import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface GetDepartmentByIdRequest {
  id: string;
}

export interface GetDepartmentByIdResponse {
  department: Department;
}

export class GetDepartmentByIdUseCase {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  async execute(
    request: GetDepartmentByIdRequest,
  ): Promise<GetDepartmentByIdResponse> {
    const { id } = request;

    const department = await this.departmentsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!department) {
      throw new Error('Department not found');
    }

    return { department };
  }
}
