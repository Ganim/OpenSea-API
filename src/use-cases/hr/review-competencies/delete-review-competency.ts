import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';
import type { ReviewCompetenciesRepository } from '@/repositories/hr/review-competencies-repository';

export interface DeleteReviewCompetencyRequest {
  tenantId: string;
  performanceReviewId: string;
  competencyId: string;
}

export class DeleteReviewCompetencyUseCase {
  constructor(
    private reviewCompetenciesRepository: ReviewCompetenciesRepository,
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(request: DeleteReviewCompetencyRequest): Promise<void> {
    const { tenantId, performanceReviewId, competencyId } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    if (review.isCompleted()) {
      throw new BadRequestError(
        'Não é possível remover competências de uma avaliação concluída',
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

    await this.reviewCompetenciesRepository.softDelete(
      new UniqueEntityID(competencyId),
    );
  }
}
