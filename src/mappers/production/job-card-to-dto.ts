import type { ProductionJobCard } from '@/entities/production/job-card';

export interface JobCardDTO {
  id: string;
  productionOrderId: string;
  operationRoutingId: string;
  workstationId: string | null;
  status: string;
  quantityPlanned: number;
  quantityCompleted: number;
  quantityScrapped: number;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  barcode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function jobCardToDTO(entity: ProductionJobCard): JobCardDTO {
  return {
    id: entity.jobCardId.toString(),
    productionOrderId: entity.productionOrderId.toString(),
    operationRoutingId: entity.operationRoutingId.toString(),
    workstationId: entity.workstationId?.toString() ?? null,
    status: entity.status,
    quantityPlanned: entity.quantityPlanned,
    quantityCompleted: entity.quantityCompleted,
    quantityScrapped: entity.quantityScrapped,
    scheduledStart: entity.scheduledStart,
    scheduledEnd: entity.scheduledEnd,
    actualStart: entity.actualStart,
    actualEnd: entity.actualEnd,
    barcode: entity.barcode,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
