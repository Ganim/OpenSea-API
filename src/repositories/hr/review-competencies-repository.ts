import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCompetency } from '@/entities/hr/review-competency';

export interface CreateReviewCompetencySchema {
  tenantId: string;
  reviewId: UniqueEntityID;
  name: string;
  selfScore?: number;
  managerScore?: number;
  weight?: number;
  comments?: string;
}

export interface UpdateReviewCompetencySchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  name?: string;
  selfScore?: number | null;
  managerScore?: number | null;
  weight?: number;
  comments?: string | null;
}

export interface ReviewCompetenciesRepository {
  create(data: CreateReviewCompetencySchema): Promise<ReviewCompetency>;
  bulkCreate(
    competencies: CreateReviewCompetencySchema[],
  ): Promise<ReviewCompetency[]>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCompetency | null>;
  findManyByReview(
    reviewId: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCompetency[]>;
  update(data: UpdateReviewCompetencySchema): Promise<ReviewCompetency | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
}
