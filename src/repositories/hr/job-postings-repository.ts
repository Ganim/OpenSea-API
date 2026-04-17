import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JobPosting } from '@/entities/hr/job-posting';

export interface CreateJobPostingSchema {
  tenantId: string;
  title: string;
  description?: string;
  departmentId?: string;
  positionId?: string;
  status?: string;
  type?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: unknown;
  benefits?: string;
  maxApplicants?: number;
}

export interface UpdateJobPostingSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  title?: string;
  description?: string;
  departmentId?: string;
  positionId?: string;
  status?: string;
  type?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: unknown;
  benefits?: string;
  maxApplicants?: number;
  publishedAt?: Date;
  closedAt?: Date;
}

export interface FindJobPostingFilters {
  status?: string;
  type?: string;
  departmentId?: string;
  positionId?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface JobPostingsRepository {
  create(data: CreateJobPostingSchema): Promise<JobPosting>;
  findById(id: UniqueEntityID, tenantId: string): Promise<JobPosting | null>;
  findMany(
    tenantId: string,
    filters?: FindJobPostingFilters,
  ): Promise<{ jobPostings: JobPosting[]; total: number }>;
  update(data: UpdateJobPostingSchema): Promise<JobPosting | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
