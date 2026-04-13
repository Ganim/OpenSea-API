import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCard } from '@/entities/production/job-card';
import { JobCardsRepository } from '@/repositories/production/job-cards-repository';

interface CompleteJobCardUseCaseRequest {
  id: string;
  tenantId: string;
}

interface CompleteJobCardUseCaseResponse {
  jobCard: ProductionJobCard;
}

export class CompleteJobCardUseCase {
  constructor(private jobCardsRepository: JobCardsRepository) {}

  async execute({
    id,
  }: CompleteJobCardUseCaseRequest): Promise<CompleteJobCardUseCaseResponse> {
    const jobCard = await this.jobCardsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!jobCard) {
      throw new ResourceNotFoundError('Job card not found.');
    }

    if (jobCard.status !== 'IN_PROGRESS') {
      throw new BadRequestError(
        'Only job cards with IN_PROGRESS status can be completed.',
      );
    }

    jobCard.complete();

    const updated = await this.jobCardsRepository.update({
      id: jobCard.jobCardId,
      status: jobCard.status,
      actualEnd: jobCard.actualEnd,
    });

    return { jobCard: updated! };
  }
}
