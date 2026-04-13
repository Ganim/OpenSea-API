import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCard } from '@/entities/production/job-card';
import { JobCardsRepository } from '@/repositories/production/job-cards-repository';

interface StartJobCardUseCaseRequest {
  id: string;
  tenantId: string;
}

interface StartJobCardUseCaseResponse {
  jobCard: ProductionJobCard;
}

export class StartJobCardUseCase {
  constructor(private jobCardsRepository: JobCardsRepository) {}

  async execute({
    id,
  }: StartJobCardUseCaseRequest): Promise<StartJobCardUseCaseResponse> {
    const jobCard = await this.jobCardsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!jobCard) {
      throw new ResourceNotFoundError('Job card not found.');
    }

    if (jobCard.status !== 'PENDING') {
      throw new BadRequestError(
        'Only job cards with PENDING status can be started.',
      );
    }

    jobCard.start();

    const updated = await this.jobCardsRepository.update({
      id: jobCard.jobCardId,
      status: jobCard.status,
      actualStart: jobCard.actualStart,
    });

    return { jobCard: updated! };
  }
}
