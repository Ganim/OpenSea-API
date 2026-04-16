import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  DEFAULT_REVIEW_COMPETENCIES,
  type ReviewCompetency,
} from '@/entities/hr/review-competency';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';
import type { ReviewCompetenciesRepository } from '@/repositories/hr/review-competencies-repository';

export interface SeedDefaultReviewCompetenciesRequest {
  tenantId: string;
  performanceReviewId: string;
}

export interface SeedDefaultReviewCompetenciesResponse {
  competencies: ReviewCompetency[];
  createdCount: number;
  alreadyExistedCount: number;
}

export class SeedDefaultReviewCompetenciesUseCase {
  constructor(
    private reviewCompetenciesRepository: ReviewCompetenciesRepository,
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(
    request: SeedDefaultReviewCompetenciesRequest,
  ): Promise<SeedDefaultReviewCompetenciesResponse> {
    const { tenantId, performanceReviewId } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    if (review.isCompleted()) {
      throw new BadRequestError(
        'Não é possível semear competências em uma avaliação concluída',
      );
    }

    const existing = await this.reviewCompetenciesRepository.findManyByReview(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    const existingNames = new Set(
      existing.map((competency) => competency.name.toLowerCase()),
    );

    const missingDefaults = DEFAULT_REVIEW_COMPETENCIES.filter(
      (defaultName) => !existingNames.has(defaultName.toLowerCase()),
    );

    const createdCompetencies =
      await this.reviewCompetenciesRepository.bulkCreate(
        missingDefaults.map((defaultName) => ({
          tenantId,
          reviewId: new UniqueEntityID(performanceReviewId),
          name: defaultName,
        })),
      );

    const allCompetencies = [...existing, ...createdCompetencies];

    return {
      competencies: allCompetencies,
      createdCount: createdCompetencies.length,
      alreadyExistedCount:
        DEFAULT_REVIEW_COMPETENCIES.length - missingDefaults.length,
    };
  }
}
