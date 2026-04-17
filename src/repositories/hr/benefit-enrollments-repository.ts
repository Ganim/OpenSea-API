import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';

export interface CreateBenefitEnrollmentSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  benefitPlanId: UniqueEntityID;
  startDate: Date;
  endDate?: Date;
  status?: string;
  employeeContribution?: number;
  employerContribution?: number;
  dependantIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateBenefitEnrollmentSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  employeeContribution?: number;
  employerContribution?: number;
  dependantIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface FindBenefitEnrollmentFilters {
  employeeId?: UniqueEntityID;
  benefitPlanId?: UniqueEntityID;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface BenefitEnrollmentsRepository {
  create(data: CreateBenefitEnrollmentSchema): Promise<BenefitEnrollment>;
  bulkCreate(
    enrollments: CreateBenefitEnrollmentSchema[],
  ): Promise<BenefitEnrollment[]>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment | null>;
  findMany(
    tenantId: string,
    filters?: FindBenefitEnrollmentFilters,
  ): Promise<{ enrollments: BenefitEnrollment[]; total: number }>;
  findByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment[]>;
  findActiveByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment[]>;
  update(
    data: UpdateBenefitEnrollmentSchema,
  ): Promise<BenefitEnrollment | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
