import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCycle } from '@/entities/hr/review-cycle';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

export interface UpdateReviewCycleRequest {
  tenantId: string;
  reviewCycleId: string;
  name?: string;
  description?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  isActive?: boolean;
}

export interface UpdateReviewCycleResponse {
  reviewCycle: ReviewCycle;
}

export class UpdateReviewCycleUseCase {
  constructor(private reviewCyclesRepository: ReviewCyclesRepository) {}

  async execute(
    request: UpdateReviewCycleRequest,
  ): Promise<UpdateReviewCycleResponse> {
    const { tenantId, reviewCycleId, name, ...updateData } = request;

    const existingCycle = await this.reviewCyclesRepository.findById(
      new UniqueEntityID(reviewCycleId),
      tenantId,
    );

    if (!existingCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError('O nome do ciclo de avaliação é obrigatório');
    }

    const updatedCycle = await this.reviewCyclesRepository.update({
      id: new UniqueEntityID(reviewCycleId),
      name: name?.trim(),
      ...updateData,
    });

    if (!updatedCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    return { reviewCycle: updatedCycle };
  }
}
