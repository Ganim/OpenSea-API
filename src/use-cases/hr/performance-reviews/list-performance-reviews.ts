import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';

export interface ListPerformanceReviewsRequest {
  tenantId: string;
  reviewCycleId?: string;
  employeeId?: string;
  reviewerId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListPerformanceReviewsResponse {
  reviews: PerformanceReview[];
  total: number;
}

export class ListPerformanceReviewsUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(
    request: ListPerformanceReviewsRequest,
  ): Promise<ListPerformanceReviewsResponse> {
    const {
      tenantId,
      reviewCycleId,
      employeeId,
      reviewerId,
      status,
      page,
      perPage,
    } = request;

    const { reviews, total } =
      await this.performanceReviewsRepository.findMany(tenantId, {
        reviewCycleId: reviewCycleId
          ? new UniqueEntityID(reviewCycleId)
          : undefined,
        employeeId: employeeId
          ? new UniqueEntityID(employeeId)
          : undefined,
        reviewerId: reviewerId
          ? new UniqueEntityID(reviewerId)
          : undefined,
        status,
        page,
        perPage,
      });

    return { reviews, total };
  }
}
