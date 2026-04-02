import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCycle } from '@/entities/hr/review-cycle';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

export interface DeleteReviewCycleRequest {
  tenantId: string;
  reviewCycleId: string;
}

export interface DeleteReviewCycleResponse {
  reviewCycle: ReviewCycle;
}

export class DeleteReviewCycleUseCase {
  constructor(private reviewCyclesRepository: ReviewCyclesRepository) {}

  async execute(
    request: DeleteReviewCycleRequest,
  ): Promise<DeleteReviewCycleResponse> {
    const { tenantId, reviewCycleId } = request;

    const reviewCycle = await this.reviewCyclesRepository.findById(
      new UniqueEntityID(reviewCycleId),
      tenantId,
    );

    if (!reviewCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    reviewCycle.softDelete();

    await this.reviewCyclesRepository.delete(new UniqueEntityID(reviewCycleId));

    return { reviewCycle };
  }
}
