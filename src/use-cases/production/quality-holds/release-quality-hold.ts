import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { QualityHoldsRepository } from '@/repositories/production/quality-holds-repository';

interface ReleaseQualityHoldUseCaseRequest {
  qualityHoldId: string;
  releasedById: string;
  resolution: string;
}

interface ReleaseQualityHoldUseCaseResponse {
  qualityHold: import('@/entities/production/quality-hold').ProductionQualityHold;
}

export class ReleaseQualityHoldUseCase {
  constructor(private qualityHoldsRepository: QualityHoldsRepository) {}

  async execute({
    qualityHoldId,
    releasedById,
    resolution,
  }: ReleaseQualityHoldUseCaseRequest): Promise<ReleaseQualityHoldUseCaseResponse> {
    const existing = await this.qualityHoldsRepository.findById(
      new UniqueEntityID(qualityHoldId),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Quality hold not found.');
    }

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestError('Quality hold is not active.');
    }

    const qualityHold = await this.qualityHoldsRepository.release({
      id: new UniqueEntityID(qualityHoldId),
      releasedById,
      resolution,
    });

    if (!qualityHold) {
      throw new ResourceNotFoundError('Quality hold not found.');
    }

    return { qualityHold };
  }
}
