import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrder } from '@/entities/sales/sales-order';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';

export interface CreateSalesOrderSchema {
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
  findById(id: UniqueEntityID): Promise<SalesOrder | null>;
  findByOrderNumber(orderNumber: string): Promise<SalesOrder | null>;
  findManyByCustomer(
    customerId: UniqueEntityID,
    page: number,
    perPage: number,
  ): Promise<SalesOrder[]>;
  findManyByStatus(
    status: OrderStatus,
    page: number,
    perPage: number,
  ): Promise<SalesOrder[]>;
  update(data: UpdateSalesOrderSchema): Promise<SalesOrder | null>;
  save(order: SalesOrder): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
