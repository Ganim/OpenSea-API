import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrder } from '@/entities/sales/sales-order';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';

export interface CreateSalesOrderSchema {
  tenantId: string;
  orderNumber: string;
  customerId: UniqueEntityID;
  createdBy?: UniqueEntityID;
  status: OrderStatus;
  discount?: number;
  notes?: string;
  items: Array<{
    variantId: UniqueEntityID;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>;
}

export interface UpdateSalesOrderSchema {
  id: UniqueEntityID;
  status?: OrderStatus;
  discount?: number;
  notes?: string;
}

export interface SalesOrdersRepository {
  create(data: CreateSalesOrderSchema): Promise<SalesOrder>;
  findById(id: UniqueEntityID, tenantId: string): Promise<SalesOrder | null>;
  findByOrderNumber(
    orderNumber: string,
    tenantId: string,
  ): Promise<SalesOrder | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<SalesOrder[]>;
  findManyByCustomer(
    customerId: UniqueEntityID,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<SalesOrder[]>;
  findManyByStatus(
    status: OrderStatus,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<SalesOrder[]>;
  update(data: UpdateSalesOrderSchema): Promise<SalesOrder | null>;
  save(order: SalesOrder): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
