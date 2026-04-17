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
  /**
   * Include soft-deleted warnings in the result set. Defaults to `false` —
   * controllers MUST NOT expose this flag to end users yet; it exists so a
   * future admin-only endpoint can surface deleted history for labor-court
   * audits (CLT Art. 474).
   */
  includeDeleted?: boolean;
}

export interface PaginatedEmployeeWarningsResult {
  warnings: EmployeeWarning[];
  total: number;
}

export interface SoftDeleteEmployeeWarningSchema {
  id: UniqueEntityID;
  tenantId: string;
  /** User id (not employee id) that triggered the delete. */
  deletedBy: string;
}

export interface EmployeeWarningsRepository {
  create(data: CreateEmployeeWarningSchema): Promise<EmployeeWarning>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
    options?: { includeDeleted?: boolean },
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
    options?: { includeDeleted?: boolean },
  ): Promise<EmployeeWarning[]>;
  countActiveByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number>;
  update(data: UpdateEmployeeWarningSchema): Promise<EmployeeWarning | null>;
  save(warning: EmployeeWarning): Promise<void>;
  /**
   * Soft-deletes the warning: sets deleted_at + deleted_by but leaves the
   * row in place. Controllers must call this instead of a hard delete so
   * disciplinary history remains auditable (CLT Art. 474).
   */
  softDelete(data: SoftDeleteEmployeeWarningSchema): Promise<void>;
}
