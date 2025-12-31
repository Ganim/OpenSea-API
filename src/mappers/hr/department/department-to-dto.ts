import type { Company } from '@/entities/hr/company';
import type { Department } from '@/entities/hr/department';
import type { Position } from '@/entities/hr/position';
import { positionToDTO, type PositionDTO } from '../position/position-to-dto';

export interface DepartmentDTO {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface DepartmentWithDetailsDTO extends DepartmentDTO {
  company?: {
    id: string;
    legalName: string;
    cnpj: string;
  } | null;
  positions?: PositionDTO[];
  positionsCount: number;
}

export function departmentToDTO(department: Department): DepartmentDTO {
  return {
    id: department.id.toString(),
    name: department.name,
    code: department.code,
    description: department.description ?? null,
    parentId: department.parentId?.toString() ?? null,
    managerId: department.managerId?.toString() ?? null,
    companyId: department.companyId.toString(),
    isActive: department.isActive,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
    deletedAt: department.deletedAt ?? null,
  };
}

export function departmentToDetailsDTO(data: {
  department: Department;
  company?: Company | null;
  positions?: Position[];
}): DepartmentWithDetailsDTO {
  const { department, company, positions } = data;

  return {
    ...departmentToDTO(department),
    company: company
      ? {
          id: company.id.toString(),
          legalName: company.legalName,
          cnpj: company.cnpj,
        }
      : null,
    positions: positions?.map(positionToDTO),
    positionsCount: positions?.length ?? 0,
  };
}
