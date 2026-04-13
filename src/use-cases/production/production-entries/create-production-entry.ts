import type { ProductionEntry } from '@/entities/production/production-entry';
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
  ) {}

  async execute({
    jobCardId,
    operatorId,
    quantityGood,
    quantityScrapped,
    quantityRework,
    notes,
  }: CreateProductionEntryUseCaseRequest): Promise<CreateProductionEntryUseCaseResponse> {
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
