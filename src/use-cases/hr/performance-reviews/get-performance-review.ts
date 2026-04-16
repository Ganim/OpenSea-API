import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { ReviewCompetency } from '@/entities/hr/review-competency';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';
import type { ReviewCompetenciesRepository } from '@/repositories/hr/review-competencies-repository';
import { aggregateCompetencyScores } from '../review-competencies/aggregate-competency-scores';

export interface GetPerformanceReviewRequest {
  tenantId: string;
  performanceReviewId: string;
}

export interface GetPerformanceReviewResponse {
  review: PerformanceReview;
  competencies: ReviewCompetency[];
  aggregatedSelfScore: number | null;
  aggregatedManagerScore: number | null;
}

export class GetPerformanceReviewUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
    private reviewCompetenciesRepository?: ReviewCompetenciesRepository,
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

    const competencies = this.reviewCompetenciesRepository
      ? await this.reviewCompetenciesRepository.findManyByReview(
          new UniqueEntityID(performanceReviewId),
          tenantId,
        )
      : [];

    const { aggregatedSelfScore, aggregatedManagerScore } =
      aggregateCompetencyScores(competencies);

    return {
      review,
      competencies,
      aggregatedSelfScore,
      aggregatedManagerScore,
    };
  }
}
