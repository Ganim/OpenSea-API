import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionEntry } from '@/entities/production/production-entry';
import type {
  ProductionEntriesRepository,
  CreateProductionEntrySchema,
} from '../production-entries-repository';

export class InMemoryProductionEntriesRepository
  implements ProductionEntriesRepository
{
  public items: ProductionEntry[] = [];

  async create(data: CreateProductionEntrySchema): Promise<ProductionEntry> {
    const productionEntry = ProductionEntry.create({
      jobCardId: new UniqueEntityID(data.jobCardId),
      operatorId: new UniqueEntityID(data.operatorId),
      quantityGood: data.quantityGood,
      quantityScrapped: data.quantityScrapped ?? 0,
      quantityRework: data.quantityRework ?? 0,
      notes: data.notes ?? null,
    });

    this.items.push(productionEntry);
    return productionEntry;
  }

  async findById(id: UniqueEntityID): Promise<ProductionEntry | null> {
    const productionEntry = this.items.find(
      (item) => item.productionEntryId.toString() === id.toString(),
    );

    return productionEntry ?? null;
  }

  async findManyByJobCardId(
    jobCardId: UniqueEntityID,
  ): Promise<ProductionEntry[]> {
    return this.items.filter(
      (item) => item.jobCardId.toString() === jobCardId.toString(),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter(
      (item) => item.productionEntryId.toString() !== id.toString(),
    );
  }
}
