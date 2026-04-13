import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionBomItem } from '@/entities/production/bom-item';

export interface CreateBomItemSchema {
  bomId: string;
  materialId: string;
  sequence: number;
  quantity: number;
  unit: string;
  wastagePercent?: number;
  isOptional?: boolean;
  substituteForId?: string;
  notes?: string;
}

export interface UpdateBomItemSchema {
  id: UniqueEntityID;
  materialId?: string;
  sequence?: number;
  quantity?: number;
  unit?: string;
  wastagePercent?: number;
  isOptional?: boolean;
  substituteForId?: string | null;
  notes?: string | null;
}

export interface BomItemsRepository {
  create(data: CreateBomItemSchema): Promise<ProductionBomItem>;
  findById(id: UniqueEntityID): Promise<ProductionBomItem | null>;
  findManyByBomId(bomId: UniqueEntityID): Promise<ProductionBomItem[]>;
  update(data: UpdateBomItemSchema): Promise<ProductionBomItem | null>;
  delete(id: UniqueEntityID): Promise<void>;
  deleteByBomId(bomId: UniqueEntityID): Promise<void>;
}
