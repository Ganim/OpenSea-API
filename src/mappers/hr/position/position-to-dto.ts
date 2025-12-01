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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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
    isActive: position.isActive,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
    deletedAt: position.deletedAt ?? null,
  };
}
