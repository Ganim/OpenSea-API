import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCard } from '@/entities/production/job-card';
import { JobCardsRepository } from '@/repositories/production/job-cards-repository';

interface ReportProductionUseCaseRequest {
  jobCardId: string;
  tenantId: string;
  operatorId: string;
  quantityGood: number;
  quantityScrapped?: number;
  quantityRework?: number;
  notes?: string;
}

interface ReportProductionUseCaseResponse {
  jobCard: ProductionJobCard;
}

export class ReportProductionUseCase {
  constructor(private jobCardsRepository: JobCardsRepository) {}

  async execute({
    jobCardId,
    quantityGood,
    quantityScrapped = 0,
    quantityRework = 0,
  }: ReportProductionUseCaseRequest): Promise<ReportProductionUseCaseResponse> {
    const jobCard = await this.jobCardsRepository.findById(
      new UniqueEntityID(jobCardId),
    );

    if (!jobCard) {
      throw new ResourceNotFoundError('Job card not found.');
    }

    if (jobCard.status !== 'IN_PROGRESS') {
      throw new BadRequestError(
        'Production can only be reported on IN_PROGRESS job cards.',
      );
    }

    if (quantityGood < 0 || quantityScrapped < 0 || quantityRework < 0) {
      throw new BadRequestError('Quantities cannot be negative.');
    }

    const totalGood = quantityGood + quantityRework;

    const updated = await this.jobCardsRepository.reportProduction(
      jobCard.jobCardId,
      totalGood,
      quantityScrapped,
    );

    return { jobCard: updated! };
  }
}
