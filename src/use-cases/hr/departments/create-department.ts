import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface CreateDepartmentRequest {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  companyId: string;
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
      tenantId,
      name,
      code,
      description,
      parentId,
      managerId,
      companyId,
      isActive = true,
    } = request;

    const companyUniqueId = new UniqueEntityID(companyId);

    // Validate if code already exists within the same company
    const existingDepartment = await this.departmentsRepository.findByCode(
      code,
      companyUniqueId,
      tenantId,
    );
    if (existingDepartment) {
      throw new Error('Department with this code already exists');
    }

    // Validate parent department if provided
    if (parentId) {
      const parentDepartment = await this.departmentsRepository.findById(
        new UniqueEntityID(parentId),
        tenantId,
      );
      if (!parentDepartment) {
        throw new Error('Parent department not found');
      }
      if (!parentDepartment.isActive) {
        throw new Error('Cannot create department under an inactive parent');
      }
      // Ensure parent belongs to the same company
      if (!parentDepartment.companyId.equals(companyUniqueId)) {
        throw new Error('Parent department must belong to the same company');
      }
    }

    // Create department
    const department = await this.departmentsRepository.create({
      tenantId,
      name,
      code,
      description,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
      managerId: managerId ? new UniqueEntityID(managerId) : undefined,
      companyId: companyUniqueId,
      isActive,
    });

    return { department };
  }
}
