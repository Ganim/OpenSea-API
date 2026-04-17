import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';

export interface CreateApplicationSchema {
  tenantId: string;
  jobPostingId: string;
  candidateId: string;
  status?: string;
  currentStageId?: string;
}

export interface UpdateApplicationSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  status?: string;
  currentStageId?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  hiredAt?: Date;
  rating?: number;
}

export interface FindApplicationFilters {
  jobPostingId?: string;
  candidateId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ApplicationsRepository {
  create(data: CreateApplicationSchema): Promise<Application>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Application | null>;
  findByJobAndCandidate(
    jobPostingId: string,
    candidateId: string,
    tenantId: string,
  ): Promise<Application | null>;
  findMany(
    tenantId: string,
    filters?: FindApplicationFilters,
  ): Promise<{ applications: Application[]; total: number }>;
  update(data: UpdateApplicationSchema): Promise<Application | null>;
  countByJobPosting(jobPostingId: string, tenantId: string): Promise<number>;
}
