import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface CreateDepartmentResponse {
  department: Department;
}

export class CreateDepartmentUseCase {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  async execute(
    request: CreateDepartmentRequest,
  ): Promise<CreateDepartmentResponse> {
    const {
      name,
      code,
      description,
      parentId,
      managerId,
      isActive = true,
    } = request;

    // Validate if code already exists
    const existingDepartment =
      await this.departmentsRepository.findByCode(code);
    if (existingDepartment) {
      throw new Error('Department with this code already exists');
    }

    // Validate parent department if provided
    if (parentId) {
      const parentDepartment = await this.departmentsRepository.findById(
        new UniqueEntityID(parentId),
      );
      if (!parentDepartment) {
        throw new Error('Parent department not found');
      }
      if (!parentDepartment.isActive) {
        throw new Error('Cannot create department under an inactive parent');
      }
    }

    // Create department
    const department = await this.departmentsRepository.create({
      name,
      code,
      description,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
      managerId: managerId ? new UniqueEntityID(managerId) : undefined,
      isActive,
    });

    return { department };
  }
}
