import type { Company } from '@/entities/hr/company';
import type { Department } from '@/entities/hr/department';
import type { Employee } from '@/entities/hr/employee';
import type { Position } from '@/entities/hr/position';

export interface PositionDTO {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  departmentId?: string | null;
  level: number;
  minSalary?: number | null;
  maxSalary?: number | null;
  baseSalary?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface EmployeeSummaryDTO {
  id: string;
  fullName: string;
  registrationNumber: string;
}

export interface PositionWithDetailsDTO extends PositionDTO {
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  company?: {
    id: string;
    legalName: string;
    cnpj: string;
  } | null;
  employeesCount: number;
  employees?: EmployeeSummaryDTO[];
}

export function positionToDTO(position: Position): PositionDTO {
  return {
    id: position.id.toString(),
    name: position.name,
    code: position.code,
    description: position.description ?? null,
    departmentId: position.departmentId?.toString() ?? null,
    level: position.level,
    minSalary: position.minSalary ?? null,
    maxSalary: position.maxSalary ?? null,
    baseSalary: position.baseSalary ?? null,
    isActive: position.isActive,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
    deletedAt: position.deletedAt ?? null,
  };
}

export function positionToDetailsDTO(data: {
  position: Position;
  department?: Department | null;
  company?: Company | null;
  employeesCount: number;
  employees?: Employee[];
}): PositionWithDetailsDTO {
  const { position, department, company, employeesCount, employees } = data;

  return {
    ...positionToDTO(position),
    department: department
      ? {
          id: department.id.toString(),
          name: department.name,
          code: department.code,
        }
      : null,
    company: company
      ? {
          id: company.id.toString(),
          legalName: company.legalName,
          cnpj: company.cnpj,
        }
      : null,
    employeesCount,
    employees: employees?.map((emp) => ({
      id: emp.id.toString(),
      fullName: emp.fullName,
      registrationNumber: emp.registrationNumber,
    })),
  };
}
