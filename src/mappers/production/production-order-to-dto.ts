import type { ProductionOrder } from '@/entities/production/production-order';

export interface ProductionOrderDTO {
  id: string;
  orderNumber: string;
  bomId: string;
  productId: string;
  salesOrderId: string | null;
  parentOrderId: string | null;
  status: string;
  priority: number;
  quantityPlanned: number;
  quantityStarted: number;
  quantityCompleted: number;
  quantityScrapped: number;
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  releasedAt: Date | null;
  releasedById: string | null;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export function productionOrderToDTO(
  entity: ProductionOrder,
): ProductionOrderDTO {
  return {
    id: entity.productionOrderId.toString(),
    orderNumber: entity.orderNumber,
    bomId: entity.bomId.toString(),
    productId: entity.productId.toString(),
    salesOrderId: entity.salesOrderId?.toString() ?? null,
    parentOrderId: entity.parentOrderId?.toString() ?? null,
    status: entity.status,
    priority: entity.priority,
    quantityPlanned: entity.quantityPlanned,
    quantityStarted: entity.quantityStarted,
    quantityCompleted: entity.quantityCompleted,
    quantityScrapped: entity.quantityScrapped,
    plannedStartDate: entity.plannedStartDate,
    plannedEndDate: entity.plannedEndDate,
    actualStartDate: entity.actualStartDate,
    actualEndDate: entity.actualEndDate,
    releasedAt: entity.releasedAt,
    releasedById: entity.releasedById?.toString() ?? null,
    notes: entity.notes,
    createdById: entity.createdById.toString(),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
