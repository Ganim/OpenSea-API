import type { ProductionBomItem } from '@/entities/production/bom-item';

export interface BomItemDTO {
  id: string;
  bomId: string;
  materialId: string;
  sequence: number;
  quantity: number;
  unit: string;
  wastagePercent: number;
  isOptional: boolean;
  substituteForId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function bomItemToDTO(entity: ProductionBomItem): BomItemDTO {
  return {
    id: entity.bomItemId.toString(),
    bomId: entity.bomId.toString(),
    materialId: entity.materialId.toString(),
    sequence: entity.sequence,
    quantity: entity.quantity,
    unit: entity.unit,
    wastagePercent: entity.wastagePercent,
    isOptional: entity.isOptional,
    substituteForId: entity.substituteForId?.toString() ?? null,
    notes: entity.notes,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
