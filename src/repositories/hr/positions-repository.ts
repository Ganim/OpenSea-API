import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';

export interface CreatePositionSchema {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: UniqueEntityID;
  level?: number;
  minSalary?: number;
  maxSalary?: number;
  baseSalary?: number;
  isActive?: boolean;
}

export interface UpdatePositionSchema {
  id: UniqueEntityID;
  name?: string;
  code?: string;
  description?: string | null;
  departmentId?: UniqueEntityID | null;
  level?: number;
  minSalary?: number | null;
  maxSalary?: number | null;
  baseSalary?: number | null;
  isActive?: boolean;
}

export interface FindManyPositionsParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  departmentId?: UniqueEntityID;
  companyId?: UniqueEntityID;
  level?: number;
}

export interface FindManyPositionsResult {
  positions: Position[];
  total: number;
}

export interface PositionsRepository {
  create(data: CreatePositionSchema): Promise<Position>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Position | null>;
  findByCode(code: string, tenantId: string): Promise<Position | null>;
  findMany(params: FindManyPositionsParams): Promise<FindManyPositionsResult>;
  findManyByDepartment(
    departmentId: UniqueEntityID,
    tenantId: string,
  ): Promise<Position[]>;
  findManyByCompany(
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Position[]>;
  findManyByLevel(level: number, tenantId: string): Promise<Position[]>;
  findManyActive(tenantId: string): Promise<Position[]>;
  hasEmployees(id: UniqueEntityID): Promise<boolean>;
  countEmployeesByPosition(positionId: UniqueEntityID): Promise<number>;
  update(data: UpdatePositionSchema): Promise<Position | null>;
  save(position: Position): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
