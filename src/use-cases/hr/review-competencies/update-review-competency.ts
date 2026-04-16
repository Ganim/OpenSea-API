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

export interface UpdateReviewCompetencyRequest {
  tenantId: string;
  performanceReviewId: string;
  competencyId: string;
  name?: string;
  weight?: number;
  selfScore?: number | null;
  managerScore?: number | null;
  comments?: string | null;
}

export interface UpdateReviewCompetencyResponse {
  competency: ReviewCompetency;
}

export class UpdateReviewCompetencyUseCase {
  constructor(
    private reviewCompetenciesRepository: ReviewCompetenciesRepository,
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(
    request: UpdateReviewCompetencyRequest,
  ): Promise<UpdateReviewCompetencyResponse> {
    const {
      tenantId,
      performanceReviewId,
      competencyId,
      name,
      weight,
      selfScore,
      managerScore,
      comments,
    } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    if (review.isCompleted()) {
      throw new BadRequestError(
        'Não é possível editar competências de uma avaliação concluída',
      );
    }

    const competency = await this.reviewCompetenciesRepository.findById(
      new UniqueEntityID(competencyId),
      tenantId,
    );

    if (!competency) {
      throw new ResourceNotFoundError('Competência não encontrada');
    }

    if (!competency.reviewId.equals(new UniqueEntityID(performanceReviewId))) {
      throw new BadRequestError(
        'A competência não pertence à avaliação informada',
      );
    }

    const trimmedName = name?.trim();
    if (trimmedName !== undefined) {
      assertCompetencyName(trimmedName);
    }
    assertPositiveWeight(weight);
    assertScoreInRange(selfScore, 'selfScore');
    assertScoreInRange(managerScore, 'managerScore');

    const updated = await this.reviewCompetenciesRepository.update({
      id: new UniqueEntityID(competencyId),
      name: trimmedName,
      weight,
      selfScore,
      managerScore,
      comments,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Competência não encontrada');
    }

    return { competency: updated };
  }
}
