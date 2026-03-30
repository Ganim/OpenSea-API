import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCycle } from '@/entities/hr/review-cycle';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

export interface OpenReviewCycleRequest {
  tenantId: string;
  reviewCycleId: string;
}

export interface OpenReviewCycleResponse {
  reviewCycle: ReviewCycle;
}

export class OpenReviewCycleUseCase {
  constructor(private reviewCyclesRepository: ReviewCyclesRepository) {}

  async execute(
    request: OpenReviewCycleRequest,
  ): Promise<OpenReviewCycleResponse> {
    const { tenantId, reviewCycleId } = request;

    const reviewCycle = await this.reviewCyclesRepository.findById(
      new UniqueEntityID(reviewCycleId),
      tenantId,
    );

    if (!reviewCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    if (reviewCycle.status !== 'DRAFT') {
      throw new BadRequestError(
        'Apenas ciclos em rascunho podem ser abertos',
      );
    }

    const updatedCycle = await this.reviewCyclesRepository.update({
      id: new UniqueEntityID(reviewCycleId),
      status: 'OPEN',
    });

    if (!updatedCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    return { reviewCycle: updatedCycle };
  }
}
