import type { ProductionEntry } from '@/entities/production/production-entry';

export interface ProductionEntryDTO {
  id: string;
  jobCardId: string;
  operatorId: string;
  quantityGood: number;
  quantityScrapped: number;
  quantityRework: number;
  enteredAt: Date;
  notes: string | null;
}

export function productionEntryToDTO(
  entity: ProductionEntry,
): ProductionEntryDTO {
  return {
    id: entity.productionEntryId.toString(),
    jobCardId: entity.jobCardId.toString(),
    operatorId: entity.operatorId.toString(),
    quantityGood: entity.quantityGood,
    quantityScrapped: entity.quantityScrapped,
    quantityRework: entity.quantityRework,
    enteredAt: entity.enteredAt,
    notes: entity.notes,
  };
}
