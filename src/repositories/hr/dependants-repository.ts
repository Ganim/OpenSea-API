import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeDependant } from '@/entities/hr/employee-dependant';

export interface CreateDependantSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  name: string;
  cpf?: string;
  cpfHash?: string;
  birthDate: Date;
  relationship: string;
  isIrrfDependant: boolean;
  isSalarioFamilia: boolean;
  hasDisability: boolean;
}

export interface UpdateDependantSchema {
  id: UniqueEntityID;
  name?: string;
  cpf?: string;
  cpfHash?: string;
  birthDate?: Date;
  relationship?: string;
  isIrrfDependant?: boolean;
  isSalarioFamilia?: boolean;
  hasDisability?: boolean;
}

export interface FindDependantFilters {
  employeeId?: UniqueEntityID;
  page?: number;
  perPage?: number;
}

export interface DependantsRepository {
  create(data: CreateDependantSchema): Promise<EmployeeDependant>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeDependant | null>;
  findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeDependant[]>;
  findMany(
    tenantId: string,
    filters?: FindDependantFilters,
  ): Promise<EmployeeDependant[]>;
  update(data: UpdateDependantSchema): Promise<EmployeeDependant | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
