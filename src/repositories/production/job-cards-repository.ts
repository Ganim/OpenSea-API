import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCardStatus } from '@/entities/production/job-card';
import { ProductionJobCard } from '@/entities/production/job-card';

export interface CreateJobCardSchema {
  productionOrderId: string;
  operationRoutingId: string;
  workstationId?: string;
  status?: ProductionJobCardStatus;
  quantityPlanned: number;
  quantityCompleted?: number;
  quantityScrapped?: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  barcode?: string;
}

export interface UpdateJobCardSchema {
  id: UniqueEntityID;
  operationRoutingId?: string;
  workstationId?: string | null;
  status?: ProductionJobCardStatus;
  quantityPlanned?: number;
  quantityCompleted?: number;
  quantityScrapped?: number;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  barcode?: string | null;
}

export interface JobCardsRepository {
  create(data: CreateJobCardSchema): Promise<ProductionJobCard>;
  findById(id: UniqueEntityID): Promise<ProductionJobCard | null>;
  findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionJobCard[]>;
  findManyByWorkstationId(
    workstationId: UniqueEntityID,
  ): Promise<ProductionJobCard[]>;
  update(data: UpdateJobCardSchema): Promise<ProductionJobCard | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
