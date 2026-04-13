import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionEntry } from '@/entities/production/production-entry';
import { ProductionEntriesRepository } from '@/repositories/production/production-entries-repository';

interface ListProductionEntriesUseCaseRequest {
  jobCardId: string;
}

interface ListProductionEntriesUseCaseResponse {
  productionEntries: ProductionEntry[];
}

export class ListProductionEntriesUseCase {
  constructor(
    private productionEntriesRepository: ProductionEntriesRepository,
  ) {}

  async execute({
    jobCardId,
  }: ListProductionEntriesUseCaseRequest): Promise<ListProductionEntriesUseCaseResponse> {
    const productionEntries =
      await this.productionEntriesRepository.findManyByJobCardId(
        new UniqueEntityID(jobCardId),
      );

    return { productionEntries };
  }
}
