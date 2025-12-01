import type { Department } from '@/entities/hr/department';

export interface DepartmentDTO {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export function departmentToDTO(department: Department): DepartmentDTO {
  return {
    id: department.id.toString(),
    name: department.name,
    code: department.code,
    description: department.description ?? null,
    parentId: department.parentId?.toString() ?? null,
    managerId: department.managerId?.toString() ?? null,
    isActive: department.isActive,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
    deletedAt: department.deletedAt ?? null,
  };
}
