import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionEntry } from '@/entities/production/production-entry';

export interface CreateProductionEntrySchema {
  jobCardId: string;
  operatorId: string;
  quantityGood: number;
  quantityScrapped?: number;
  quantityRework?: number;
  notes?: string;
}

export interface ProductionEntriesRepository {
  create(data: CreateProductionEntrySchema): Promise<ProductionEntry>;
  findById(id: UniqueEntityID): Promise<ProductionEntry | null>;
  findManyByJobCardId(jobCardId: UniqueEntityID): Promise<ProductionEntry[]>;
  delete(id: UniqueEntityID): Promise<void>;
}
