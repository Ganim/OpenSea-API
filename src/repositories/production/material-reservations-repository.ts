import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionMaterialReservation } from '@/entities/production/material-reservation';

export interface CreateMaterialReservationSchema {
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantityReserved: number;
}

export interface UpdateMaterialReservationSchema {
  id: UniqueEntityID;
  quantityIssued?: number;
  status?: string;
}

export interface MaterialReservationsRepository {
  create(
    data: CreateMaterialReservationSchema,
  ): Promise<ProductionMaterialReservation>;
  findById(id: UniqueEntityID): Promise<ProductionMaterialReservation | null>;
  findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialReservation[]>;
  update(
    data: UpdateMaterialReservationSchema,
  ): Promise<ProductionMaterialReservation | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
