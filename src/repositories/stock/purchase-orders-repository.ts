import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { PurchaseOrder } from '@/entities/stock/purchase-order';

export interface CreatePurchaseOrderSchema {
  orderNumber: string;
  supplierId: UniqueEntityID;
  createdBy?: UniqueEntityID;
  status: OrderStatus;
  expectedDate?: Date;
  notes?: string;
  items: Array<{
    variantId: UniqueEntityID;
    quantity: number;
    unitCost: number;
    notes?: string;
  }>;
}

export interface UpdatePurchaseOrderSchema {
  id: UniqueEntityID;
  status?: OrderStatus;
  expectedDate?: Date;
  receivedDate?: Date;
  notes?: string;
}

export interface PurchaseOrdersRepository {
  create(data: CreatePurchaseOrderSchema): Promise<PurchaseOrder>;
  findById(id: UniqueEntityID): Promise<PurchaseOrder | null>;
  findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null>;
  findManyBySupplier(
    supplierId: UniqueEntityID,
    page: number,
    perPage: number,
  ): Promise<PurchaseOrder[]>;
  findManyByStatus(
    status: OrderStatus,
    page: number,
    perPage: number,
  ): Promise<PurchaseOrder[]>;
  update(data: UpdatePurchaseOrderSchema): Promise<PurchaseOrder | null>;
  save(order: PurchaseOrder): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
