import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionOrderStatus } from '@/entities/production/production-order';
import { ProductionOrder } from '@/entities/production/production-order';

export interface CreateProductionOrderSchema {
  tenantId: string;
  orderNumber: string;
  bomId: string;
  productId: string;
  salesOrderId?: string;
  parentOrderId?: string;
  status?: ProductionOrderStatus;
  priority: number;
  quantityPlanned: number;
  quantityStarted?: number;
  quantityCompleted?: number;
  quantityScrapped?: number;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  releasedAt?: Date;
  releasedById?: string;
  notes?: string;
  createdById: string;
}

export interface UpdateProductionOrderSchema {
  id: UniqueEntityID;
  orderNumber?: string;
  bomId?: string;
  productId?: string;
  salesOrderId?: string | null;
  parentOrderId?: string | null;
  status?: ProductionOrderStatus;
  priority?: number;
  quantityPlanned?: number;
  quantityStarted?: number;
  quantityCompleted?: number;
  quantityScrapped?: number;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  releasedAt?: Date | null;
  releasedById?: string | null;
  notes?: string | null;
}

export interface ProductionOrdersRepository {
  create(data: CreateProductionOrderSchema): Promise<ProductionOrder>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOrder | null>;
  findByOrderNumber(
    orderNumber: string,
    tenantId: string,
  ): Promise<ProductionOrder | null>;
  findMany(
    tenantId: string,
    options?: { page?: number; limit?: number },
  ): Promise<ProductionOrder[]>;
  findManyByStatus(
    tenantId: string,
    status: string,
  ): Promise<ProductionOrder[]>;
  getNextOrderNumber(tenantId: string): Promise<string>;
  countByStatus(tenantId: string): Promise<Record<string, number>>;
  update(data: UpdateProductionOrderSchema): Promise<ProductionOrder | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
