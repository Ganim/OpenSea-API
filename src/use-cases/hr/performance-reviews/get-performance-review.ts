import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';

export interface GetPerformanceReviewRequest {
  tenantId: string;
  performanceReviewId: string;
}

export interface GetPerformanceReviewResponse {
  review: PerformanceReview;
}

export class GetPerformanceReviewUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(
    request: GetPerformanceReviewRequest,
  ): Promise<GetPerformanceReviewResponse> {
    const { tenantId, performanceReviewId } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    return { review };
  }
}
