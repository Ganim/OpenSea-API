import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';

export interface CreatePositionSchema {
  name: string;
  code: string;
  description?: string;
  departmentId?: UniqueEntityID;
  level?: number;
  minSalary?: number;
  maxSalary?: number;
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
  isActive?: boolean;
}

export interface FindManyPositionsParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  departmentId?: UniqueEntityID;
  level?: number;
}

export interface FindManyPositionsResult {
  positions: Position[];
  total: number;
}

export interface PositionsRepository {
  create(data: CreatePositionSchema): Promise<Position>;
  findById(id: UniqueEntityID): Promise<Position | null>;
  findByCode(code: string): Promise<Position | null>;
  findMany(params: FindManyPositionsParams): Promise<FindManyPositionsResult>;
  findManyByDepartment(departmentId: UniqueEntityID): Promise<Position[]>;
  findManyByLevel(level: number): Promise<Position[]>;
  findManyActive(): Promise<Position[]>;
  hasEmployees(id: UniqueEntityID): Promise<boolean>;
  update(data: UpdatePositionSchema): Promise<Position | null>;
  save(position: Position): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
