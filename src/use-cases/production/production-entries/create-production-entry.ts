import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionEntry } from '@/entities/production/production-entry';
import type { JobCardsRepository } from '@/repositories/production/job-cards-repository';
import { ProductionEntriesRepository } from '@/repositories/production/production-entries-repository';

interface CreateProductionEntryUseCaseRequest {
  jobCardId: string;
  operatorId: string;
  quantityGood: number;
  quantityScrapped?: number;
  quantityRework?: number;
  notes?: string;
}

interface CreateProductionEntryUseCaseResponse {
  productionEntry: ProductionEntry;
}

export class CreateProductionEntryUseCase {
  constructor(
    private productionEntriesRepository: ProductionEntriesRepository,
    private jobCardsRepository: JobCardsRepository,
  ) {}

  async execute({
    jobCardId,
    operatorId,
    quantityGood,
    quantityScrapped,
    quantityRework,
    notes,
  }: CreateProductionEntryUseCaseRequest): Promise<CreateProductionEntryUseCaseResponse> {
    const jobCard = await this.jobCardsRepository.findById(
      new UniqueEntityID(jobCardId),
    );

    if (!jobCard) {
      throw new ResourceNotFoundError('Job card not found.');
    }

    if (jobCard.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Job card must be IN_PROGRESS to register production entries.');
    }

    if (quantityGood + (quantityScrapped ?? 0) + (quantityRework ?? 0) <= 0) {
      throw new BadRequestError('Total quantity must be greater than zero.');
    }

    const productionEntry = await this.productionEntriesRepository.create({
      jobCardId,
      operatorId,
      quantityGood,
      quantityScrapped,
      quantityRework,
      notes,
    });

    return { productionEntry };
  }
}
