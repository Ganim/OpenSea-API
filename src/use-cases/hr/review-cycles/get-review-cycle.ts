import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCycle } from '@/entities/hr/review-cycle';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

export interface GetReviewCycleRequest {
  tenantId: string;
  reviewCycleId: string;
}

export interface GetReviewCycleResponse {
  reviewCycle: ReviewCycle;
}

export class GetReviewCycleUseCase {
  constructor(private reviewCyclesRepository: ReviewCyclesRepository) {}

  async execute(
    request: GetReviewCycleRequest,
  ): Promise<GetReviewCycleResponse> {
    const { tenantId, reviewCycleId } = request;

    const reviewCycle = await this.reviewCyclesRepository.findById(
      new UniqueEntityID(reviewCycleId),
      tenantId,
    );

    if (!reviewCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    return { reviewCycle };
  }
}
