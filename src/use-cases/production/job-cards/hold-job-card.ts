import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCard } from '@/entities/production/job-card';
import { JobCardsRepository } from '@/repositories/production/job-cards-repository';

interface HoldJobCardUseCaseRequest {
  id: string;
  tenantId: string;
}

interface HoldJobCardUseCaseResponse {
  jobCard: ProductionJobCard;
}

export class HoldJobCardUseCase {
  constructor(private jobCardsRepository: JobCardsRepository) {}

  async execute({
    id,
  }: HoldJobCardUseCaseRequest): Promise<HoldJobCardUseCaseResponse> {
    const jobCard = await this.jobCardsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!jobCard) {
      throw new ResourceNotFoundError('Job card not found.');
    }

    if (jobCard.status !== 'IN_PROGRESS') {
      throw new BadRequestError(
        'Only job cards with IN_PROGRESS status can be put on hold.',
      );
    }

    jobCard.hold();

    const updated = await this.jobCardsRepository.update({
      id: jobCard.jobCardId,
      status: jobCard.status,
    });

    return { jobCard: updated! };
  }
}
