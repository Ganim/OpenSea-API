import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';

export interface CreateDepartmentSchema {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: UniqueEntityID;
  managerId?: UniqueEntityID;
  companyId: UniqueEntityID;
  isActive?: boolean;
}

export interface UpdateDepartmentSchema {
  id: UniqueEntityID;
  name?: string;
  code?: string;
  description?: string | null;
  parentId?: UniqueEntityID | null;
  managerId?: UniqueEntityID | null;
  isActive?: boolean;
}

export interface FindManyDepartmentsParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  parentId?: UniqueEntityID;
  companyId?: UniqueEntityID;
}

export interface FindManyDepartmentsResult {
  departments: Department[];
  total: number;
}

export interface DepartmentsRepository {
  create(data: CreateDepartmentSchema): Promise<Department>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Department | null>;
  findByCode(
    code: string,
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department | null>;
  findMany(
    params: FindManyDepartmentsParams,
  ): Promise<FindManyDepartmentsResult>;
  findManyByParent(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]>;
  findManyByManager(
    managerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]>;
  findManyByCompany(
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]>;
  findManyActive(tenantId: string): Promise<Department[]>;
  hasChildren(id: UniqueEntityID): Promise<boolean>;
  hasEmployees(id: UniqueEntityID): Promise<boolean>;
  update(data: UpdateDepartmentSchema): Promise<Department | null>;
  save(department: Department): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
