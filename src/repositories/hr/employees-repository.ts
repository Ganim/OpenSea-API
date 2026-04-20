import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  EmergencyContactInfo,
  Employee,
  HealthCondition,
} from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from '@/entities/hr/value-objects';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateEmployeeSchema {
  tenantId: string;
  registrationNumber: string;
  userId?: UniqueEntityID;
  fullName: string;
  socialName?: string;
  birthDate?: Date;
  gender?: string;
  pcd?: boolean;
  maritalStatus?: string;
  nationality?: string;
  birthPlace?: string;
  emergencyContactInfo?: EmergencyContactInfo;
  healthConditions?: HealthCondition[];
  cpf: CPF;
  rg?: string;
  rgIssuer?: string;
  rgIssueDate?: Date;
  pis?: PIS;
  ctpsNumber?: string;
  ctpsSeries?: string;
  ctpsState?: string;
  voterTitle?: string;
  militaryDoc?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  mobilePhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  bankCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  pixKey?: string;
  departmentId?: UniqueEntityID;
  positionId?: UniqueEntityID;
  supervisorId?: UniqueEntityID;
  companyId?: UniqueEntityID;
  hireDate: Date;
  terminationDate?: Date;
  status: EmployeeStatus;
  baseSalary?: number;
  contractType: ContractType;
  workRegime: WorkRegime;
  weeklyHours: number;
  photoUrl?: string;
  isPregnant?: boolean;
  pregnancyStartDate?: Date;
  childBirthDate?: Date;
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
}

export interface UpdateEmployeeSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so that the underlying Prisma `where` clause is scoped and cannot
   * update a record belonging to another tenant.
   */
  tenantId?: string;
  registrationNumber?: string;
  userId?: UniqueEntityID | null; // null para desvincular
  fullName?: string;
  socialName?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
  pcd?: boolean;
  maritalStatus?: string | null;
  nationality?: string | null;
  birthPlace?: string | null;
  emergencyContactInfo?: EmergencyContactInfo | null;
  healthConditions?: HealthCondition[] | null;
  cpf?: CPF;
  rg?: string | null;
  rgIssuer?: string | null;
  rgIssueDate?: Date | null;
  pis?: PIS | null;
  ctpsNumber?: string | null;
  ctpsSeries?: string | null;
  ctpsState?: string | null;
  voterTitle?: string | null;
  militaryDoc?: string | null;
  email?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string;
  bankCode?: string | null;
  bankName?: string | null;
  bankAgency?: string | null;
  bankAccount?: string | null;
  bankAccountType?: string | null;
  pixKey?: string | null;
  departmentId?: UniqueEntityID | null;
  positionId?: UniqueEntityID | null;
  supervisorId?: UniqueEntityID | null;
  companyId?: UniqueEntityID | null;
  hireDate?: Date;
  terminationDate?: Date | null;
  status?: EmployeeStatus;
  baseSalary?: number;
  contractType?: ContractType;
  workRegime?: WorkRegime;
  weeklyHours?: number;
  photoUrl?: string | null;
  isPregnant?: boolean;
  pregnancyStartDate?: Date | null;
  childBirthDate?: Date | null;
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
}

export interface EmployeeWithRawRelations {
  employee: Employee;
  rawRelations: {
    department?: { id: string; name: string; code: string } | null;
    position?: { id: string; name: string; level?: number | null } | null;
    company?: {
      id: string;
      legalName: string;
      tradeName?: string | null;
    } | null;
  };
}

export interface FindEmployeeFilters {
  status?: string;
  departmentId?: UniqueEntityID;
  positionId?: UniqueEntityID;
  supervisorId?: UniqueEntityID;
  companyId?: UniqueEntityID;
  userId?: string;
  search?: string;
  unlinked?: boolean;
  includeDeleted?: boolean;
}

export interface PaginatedEmployeesResult {
  employees: Employee[];
  total: number;
}

/**
 * Payload to anonymize an employee in compliance with LGPD Art. 18 VI.
 *
 * The repository is expected to BYPASS the regular Employee value-object
 * validations (e.g. CPF check digit) because anonymized records intentionally
 * carry placeholder/derived values for the affected PII columns.
 *
 * Fiscal data (payroll, terminations), audit logs and eSocial events MUST
 * remain intact for the legal retention period (5+ years).
 */
export interface AnonymizeEmployeeSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  /** SHA-256 hash of the original CPF — preserves uniqueness without exposing PII. */
  cpfHashedValue: string;
  /** Blind-index hash for the new placeholder CPF (optional, only when cipher is configured). */
  cpfBlindIndex?: string;
  /** ISO timestamp recorded inside metadata.anonymizedAt. */
  anonymizedAt: Date;
  /** Subject identifier of the user who triggered the anonymization. */
  anonymizedByUserId: string;
  /** Anonymization reason recorded inside metadata.anonymizationReason. */
  reason?: string;
}

/**
 * Lightweight row shape returned by {@link EmployeesRepository.findAllForCrachas}.
 *
 * Only the fields needed to render the admin listing at `/hr/crachas` (and to
 * fan out bulk-badge-PDF jobs in Plan 05-06) are surfaced here. The caller
 * derives `rotationStatus` from `qrTokenSetAt` server-side; filtering by it
 * is already applied inside the repository.
 */
export interface CrachaListItem {
  id: string;
  fullName: string;
  registration: string;
  photoUrl: string | null;
  departmentName: string | null;
  qrTokenSetAt: Date | null;
}

/** Status derived from `qrTokenSetAt` for the `/hr/crachas` listing. */
export type CrachaRotationStatus = 'active' | 'recent' | 'never';

export interface FindCrachasFilters {
  departmentId?: string;
  rotationStatus?: CrachaRotationStatus;
  search?: string;
  /** 1-indexed page number. */
  page: number;
  /** Cap 100 — repositories MUST clamp to this. */
  pageSize: number;
}

export interface CrachasPaginatedResult {
  items: CrachaListItem[];
  total: number;
}

export interface EmployeesRepository {
  create(data: CreateEmployeeSchema, tx?: TransactionClient): Promise<Employee>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee | null>;
  findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<EmployeeWithRawRelations | null>;
  findByRegistrationNumber(
    registrationNumber: string,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee | null>;
  findByCpf(
    cpf: CPF,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee | null>;
  findByUserId(
    userId: UniqueEntityID,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee | null>;
  /** Find employee by userId without tenant scope (userId is globally unique) */
  findByUserIdAnyTenant(userId: UniqueEntityID): Promise<Employee | null>;
  findByPis(
    pis: PIS,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee | null>;
  findMany(tenantId: string, includeDeleted?: boolean): Promise<Employee[]>;
  findManyPaginated(
    tenantId: string,
    filters: FindEmployeeFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeesResult>;
  findManyByStatus(
    status: EmployeeStatus,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee[]>;
  findManyByDepartment(
    departmentId: UniqueEntityID,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee[]>;
  findManyByPosition(
    positionId: UniqueEntityID,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee[]>;
  findManyBySupervisor(
    supervisorId: UniqueEntityID,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee[]>;
  findManyActive(
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee[]>;
  findManyTerminated(
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee[]>;
  findManyByCompany(
    companyId: UniqueEntityID,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Employee[]>;
  update(data: UpdateEmployeeSchema): Promise<Employee | null>;
  save(employee: Employee): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  /**
   * Anonymizes an employee record (LGPD Art. 18 VI — conservative strategy).
   *
   * Replaces every PII column with placeholder/hashed values while keeping the
   * row intact so that fiscal, payroll, audit and eSocial relations remain
   * referenceable for the legal retention period.
   *
   * Cascades to {@link EmployeeDependant} rows belonging to the employee.
   */
  anonymize(data: AnonymizeEmployeeSchema): Promise<Employee | null>;

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 5 — kiosk QR rotation (D-14, D-15)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Resolves an employee by the SHA-256 hash of its QR token, tenant-scoped.
   * Used by Plan 05-07 `FaceMatchValidator` / `ExecutePunchUseCase` QR branch
   * to hydrate the funcionário when the kiosk scans a crachá. Returns `null`
   * when no non-deleted employee in the tenant holds that hash (supports the
   * lost/rotated/cross-tenant cases without leaking existence).
   */
  findByQrTokenHash(hash: string, tenantId: string): Promise<Employee | null>;

  /**
   * Replaces the QR token hash of a single employee (sync flow, D-14
   * individual). Stamps `qrTokenSetAt = now()`. Throws {@link
   * ResourceNotFoundError} when the target employee does not exist inside
   * the tenant (or is soft-deleted).
   */
  rotateQrToken(
    employeeId: string,
    tenantId: string,
    hash: string,
  ): Promise<void>;

  /**
   * Bulk rotation entry point used by the `qr-batch` worker (D-14 bulk).
   * Applies every `{ employeeId, hash }` pair inside a single `$transaction`
   * so the chunk is all-or-nothing. Returns the number of rows actually
   * updated (IDs that do not belong to the tenant — or are soft-deleted —
   * are silently skipped so a single bad input does not kill the chunk).
   */
  rotateQrTokensBulk(
    updates: Array<{ employeeId: string; hash: string }>,
    tenantId: string,
  ): Promise<number>;

  /**
   * Returns the IDs of every non-deleted, non-terminated employee in the
   * tenant — required by the bulk rotation use case when `scope='ALL'`.
   */
  findAllIds(tenantId: string): Promise<string[]>;

  /**
   * Returns the IDs of every non-deleted, non-terminated employee in the
   * tenant whose `departmentId` falls in the supplied list — required by
   * the bulk rotation use case when `scope='DEPARTMENT'`.
   */
  findIdsByDepartments(
    departmentIds: string[],
    tenantId: string,
  ): Promise<string[]>;

  /**
   * Paged listing for the admin `/hr/crachas` page. See
   * {@link FindCrachasFilters} for the semantics of `rotationStatus` /
   * `search`. Only non-deleted, non-terminated employees are returned;
   * items are sorted by `fullName` ascending for a stable UX.
   */
  findAllForCrachas(
    tenantId: string,
    filters: FindCrachasFilters,
  ): Promise<CrachasPaginatedResult>;
}
