import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCompetency } from '@/entities/hr/review-competency';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';
import type { ReviewCompetenciesRepository } from '@/repositories/hr/review-competencies-repository';

export interface ListReviewCompetenciesRequest {
  tenantId: string;
  performanceReviewId: string;
}

export interface ListReviewCompetenciesResponse {
  competencies: ReviewCompetency[];
}

export class ListReviewCompetenciesUseCase {
  constructor(
    private reviewCompetenciesRepository: ReviewCompetenciesRepository,
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(
    request: ListReviewCompetenciesRequest,
  ): Promise<ListReviewCompetenciesResponse> {
    const { tenantId, performanceReviewId } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    const competencies =
      await this.reviewCompetenciesRepository.findManyByReview(
        new UniqueEntityID(performanceReviewId),
        tenantId,
      );

    return { competencies };
  }
}
