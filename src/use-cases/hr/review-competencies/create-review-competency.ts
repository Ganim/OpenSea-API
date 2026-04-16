import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCompetency } from '@/entities/hr/review-competency';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';
import type { ReviewCompetenciesRepository } from '@/repositories/hr/review-competencies-repository';
import {
  assertCompetencyName,
  assertPositiveWeight,
  assertScoreInRange,
} from './competency-validation';

export interface CreateReviewCompetencyRequest {
  tenantId: string;
  performanceReviewId: string;
  name: string;
  weight?: number;
  selfScore?: number;
  managerScore?: number;
  comments?: string;
}

export interface CreateReviewCompetencyResponse {
  competency: ReviewCompetency;
}

export class CreateReviewCompetencyUseCase {
  constructor(
    private reviewCompetenciesRepository: ReviewCompetenciesRepository,
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(
    request: CreateReviewCompetencyRequest,
  ): Promise<CreateReviewCompetencyResponse> {
    const {
      tenantId,
      performanceReviewId,
      name,
      weight,
      selfScore,
      managerScore,
      comments,
    } = request;

    const trimmedName = name.trim();
    assertCompetencyName(trimmedName);
    assertPositiveWeight(weight);
    assertScoreInRange(selfScore, 'selfScore');
    assertScoreInRange(managerScore, 'managerScore');

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    if (review.isCompleted()) {
      throw new BadRequestError(
        'Não é possível adicionar competências em uma avaliação concluída',
      );
    }

    const competency = await this.reviewCompetenciesRepository.create({
      tenantId,
      reviewId: new UniqueEntityID(performanceReviewId),
      name: trimmedName,
      weight,
      selfScore,
      managerScore,
      comments,
    });

    return { competency };
  }
}
