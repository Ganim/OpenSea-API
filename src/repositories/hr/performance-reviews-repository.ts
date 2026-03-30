import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';

export interface CreatePerformanceReviewSchema {
  tenantId: string;
  reviewCycleId: UniqueEntityID;
  employeeId: UniqueEntityID;
  reviewerId: UniqueEntityID;
  status?: string;
}

export interface UpdatePerformanceReviewSchema {
  id: UniqueEntityID;
  status?: string;
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  selfComments?: string;
  managerComments?: string;
  strengths?: string;
  improvements?: string;
  goals?: string;
  employeeAcknowledged?: boolean;
  acknowledgedAt?: Date;
  completedAt?: Date;
}

export interface FindPerformanceReviewFilters {
  reviewCycleId?: UniqueEntityID;
  employeeId?: UniqueEntityID;
  reviewerId?: UniqueEntityID;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface PerformanceReviewsRepository {
  create(data: CreatePerformanceReviewSchema): Promise<PerformanceReview>;
  bulkCreate(
    reviews: CreatePerformanceReviewSchema[],
  ): Promise<PerformanceReview[]>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PerformanceReview | null>;
  findMany(
    tenantId: string,
    filters?: FindPerformanceReviewFilters,
  ): Promise<{ reviews: PerformanceReview[]; total: number }>;
  findByCycleAndEmployee(
    reviewCycleId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<PerformanceReview | null>;
  update(
    data: UpdatePerformanceReviewSchema,
  ): Promise<PerformanceReview | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
