import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionMaterialReturn } from '@/entities/production/material-return';

export interface CreateMaterialReturnSchema {
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
  returnedById: string;
}

export interface MaterialReturnsRepository {
  create(data: CreateMaterialReturnSchema): Promise<ProductionMaterialReturn>;
  findById(id: UniqueEntityID): Promise<ProductionMaterialReturn | null>;
  findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialReturn[]>;
}
