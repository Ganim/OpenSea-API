import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface UpdateDepartmentRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  isActive?: boolean;
}

export interface UpdateDepartmentResponse {
  department: Department;
}

export class UpdateDepartmentUseCase {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  async execute(
    request: UpdateDepartmentRequest,
  ): Promise<UpdateDepartmentResponse> {
    const { id, name, code, description, parentId, managerId, isActive } =
      request;

    const departmentId = new UniqueEntityID(id);

    // Find existing department
    const existingDepartment =
      await this.departmentsRepository.findById(departmentId);
    if (!existingDepartment) {
      throw new Error('Department not found');
    }

    // Validate code uniqueness if changing
    if (code && code !== existingDepartment.code) {
      const departmentWithCode =
        await this.departmentsRepository.findByCode(code);
      if (departmentWithCode) {
        throw new Error('Department with this code already exists');
      }
    }

    // Validate parent department if provided
    if (parentId !== undefined && parentId !== null) {
      const parentUniqueId = new UniqueEntityID(parentId);

      // Check if trying to set itself as parent
      if (parentUniqueId.equals(departmentId)) {
        throw new Error('Department cannot be its own parent');
      }

      const parentDepartment =
        await this.departmentsRepository.findById(parentUniqueId);
      if (!parentDepartment) {
        throw new Error('Parent department not found');
      }

      // Check for circular reference (parent cannot be a child of this department)
      const children =
        await this.departmentsRepository.findManyByParent(departmentId);
      const isCircular = this.checkCircularReference(parentUniqueId, children);
      if (isCircular) {
        throw new Error('Cannot set a child department as parent');
      }
    }

    // Update department
    const department = await this.departmentsRepository.update({
      id: departmentId,
      name,
      code,
      description,
      parentId:
        parentId === null
          ? null
          : parentId
            ? new UniqueEntityID(parentId)
            : undefined,
      managerId:
        managerId === null
          ? null
          : managerId
            ? new UniqueEntityID(managerId)
            : undefined,
      isActive,
    });

    if (!department) {
      throw new Error('Failed to update department');
    }

    return { department };
  }

  private checkCircularReference(
    targetId: UniqueEntityID,
    children: Department[],
  ): boolean {
    for (const child of children) {
      if (child.id.equals(targetId)) {
        return true;
      }
    }
    return false;
  }
}
