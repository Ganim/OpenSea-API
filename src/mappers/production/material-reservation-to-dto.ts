import type { ProductionMaterialReservation } from '@/entities/production/material-reservation';
import type { MaterialReservationStatus } from '@/entities/production/material-reservation';

export interface MaterialReservationDTO {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantityReserved: number;
  quantityIssued: number;
  status: MaterialReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function materialReservationToDTO(
  entity: ProductionMaterialReservation,
): MaterialReservationDTO {
  return {
    id: entity.materialReservationId.toString(),
    productionOrderId: entity.productionOrderId.toString(),
    materialId: entity.materialId.toString(),
    warehouseId: entity.warehouseId.toString(),
    quantityReserved: entity.quantityReserved,
    quantityIssued: entity.quantityIssued,
    status: entity.status,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
