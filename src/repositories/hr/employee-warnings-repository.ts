import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';

export interface CreateEmployeeWarningSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  issuedBy: UniqueEntityID;
  type: string;
  severity: string;
  reason: string;
  description?: string;
  incidentDate: Date;
  witnessName?: string;
  suspensionDays?: number;
  attachmentUrl?: string;
}

export interface UpdateEmployeeWarningSchema {
  id: UniqueEntityID;
  tenantId?: string;
  type?: string;
  severity?: string;
  reason?: string;
  description?: string;
  incidentDate?: Date;
  witnessName?: string;
  suspensionDays?: number;
  attachmentUrl?: string;
}

export interface FindEmployeeWarningFilters {
  employeeId?: UniqueEntityID;
  type?: string;
  severity?: string;
  status?: string;
}

export interface PaginatedEmployeeWarningsResult {
  warnings: EmployeeWarning[];
  total: number;
}

export interface EmployeeWarningsRepository {
  create(data: CreateEmployeeWarningSchema): Promise<EmployeeWarning>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeWarning | null>;
  findManyPaginated(
    tenantId: string,
    filters: FindEmployeeWarningFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeWarningsResult>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeWarning[]>;
  countActiveByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number>;
  update(data: UpdateEmployeeWarningSchema): Promise<EmployeeWarning | null>;
  save(warning: EmployeeWarning): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
