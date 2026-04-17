import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCycle } from '@/entities/hr/review-cycle';

export interface CreateReviewCycleSchema {
  tenantId: string;
  name: string;
  description?: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status?: string;
  isActive?: boolean;
}

export interface UpdateReviewCycleSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  name?: string;
  description?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  isActive?: boolean;
}

export interface FindReviewCycleFilters {
  type?: string;
  status?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ReviewCyclesRepository {
  create(data: CreateReviewCycleSchema): Promise<ReviewCycle>;
  findById(id: UniqueEntityID, tenantId: string): Promise<ReviewCycle | null>;
  findMany(
    tenantId: string,
    filters?: FindReviewCycleFilters,
  ): Promise<{ reviewCycles: ReviewCycle[]; total: number }>;
  update(data: UpdateReviewCycleSchema): Promise<ReviewCycle | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
