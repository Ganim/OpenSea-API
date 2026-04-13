import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCard } from '@/entities/production/job-card';
import { JobCardsRepository } from '@/repositories/production/job-cards-repository';

interface ListJobCardsUseCaseRequest {
  tenantId: string;
  productionOrderId?: string;
  workstationId?: string;
}

interface ListJobCardsUseCaseResponse {
  jobCards: ProductionJobCard[];
}

export class ListJobCardsUseCase {
  constructor(private jobCardsRepository: JobCardsRepository) {}

  async execute({
    productionOrderId,
    workstationId,
  }: ListJobCardsUseCaseRequest): Promise<ListJobCardsUseCaseResponse> {
    let jobCards: ProductionJobCard[] = [];

    if (productionOrderId) {
      jobCards = await this.jobCardsRepository.findManyByProductionOrderId(
        new UniqueEntityID(productionOrderId),
      );
    } else if (workstationId) {
      jobCards = await this.jobCardsRepository.findManyByWorkstationId(
        new UniqueEntityID(workstationId),
      );
    }

    return { jobCards };
  }
}
