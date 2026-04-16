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
  update(
    data: UpdateReviewCompetencySchema,
  ): Promise<ReviewCompetency | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
}
