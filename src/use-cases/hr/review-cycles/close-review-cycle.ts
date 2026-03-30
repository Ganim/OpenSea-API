import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCycle } from '@/entities/hr/review-cycle';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

export interface CloseReviewCycleRequest {
  tenantId: string;
  reviewCycleId: string;
}

export interface CloseReviewCycleResponse {
  reviewCycle: ReviewCycle;
}

export class CloseReviewCycleUseCase {
  constructor(private reviewCyclesRepository: ReviewCyclesRepository) {}

  async execute(
    request: CloseReviewCycleRequest,
  ): Promise<CloseReviewCycleResponse> {
    const { tenantId, reviewCycleId } = request;

    const reviewCycle = await this.reviewCyclesRepository.findById(
      new UniqueEntityID(reviewCycleId),
      tenantId,
    );

    if (!reviewCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    if (reviewCycle.status === 'CLOSED') {
      throw new BadRequestError('O ciclo de avaliação já está fechado');
    }

    if (reviewCycle.status === 'DRAFT') {
      throw new BadRequestError(
        'Não é possível fechar um ciclo em rascunho. Abra o ciclo primeiro.',
      );
    }

    const updatedCycle = await this.reviewCyclesRepository.update({
      id: new UniqueEntityID(reviewCycleId),
      status: 'CLOSED',
    });

    if (!updatedCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    return { reviewCycle: updatedCycle };
  }
}
