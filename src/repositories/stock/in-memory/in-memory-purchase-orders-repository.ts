import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from '@/entities/stock/purchase-order';
import type {
  CreatePurchaseOrderSchema,
  PurchaseOrdersRepository,
  UpdatePurchaseOrderSchema,
} from '../purchase-orders-repository';

export class InMemoryPurchaseOrdersRepository
  implements PurchaseOrdersRepository
{
  public items: PurchaseOrder[] = [];

  async create(data: CreatePurchaseOrderSchema): Promise<PurchaseOrder> {
    const order = PurchaseOrder.create({
      tenantId: new UniqueEntityID(data.tenantId),
      orderNumber: data.orderNumber,
      supplierId: data.supplierId,
      createdBy: data.createdBy,
      status: data.status,
      expectedDate: data.expectedDate,
      notes: data.notes,
      items: [],
    });

    // Add items to the order
    if (data.items && data.items.length > 0) {
      for (const itemData of data.items) {
        const item = PurchaseOrderItem.create({
          orderId: order.id,
          variantId: itemData.variantId,
          quantity: itemData.quantity,
          unitCost: itemData.unitCost,
          notes: itemData.notes,
        });
        order.addItem(item);
      }
    }

    this.items.push(order);
    return order;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PurchaseOrder | null> {
    const order = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return order ?? null;
  }

  async findByOrderNumber(
    orderNumber: string,
    tenantId: string,
  ): Promise<PurchaseOrder | null> {
    const order = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.orderNumber === orderNumber &&
        item.tenantId.toString() === tenantId,
    );
    return order ?? null;
  }

  async findManyByStatus(
    status: OrderStatus,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<PurchaseOrder[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) =>
          !item.deletedAt &&
          item.status.value === status.value &&
          item.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async findManyBySupplier(
    supplierId: UniqueEntityID,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<PurchaseOrder[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) =>
          !item.deletedAt &&
          item.supplierId.equals(supplierId) &&
          item.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async update(data: UpdatePurchaseOrderSchema): Promise<PurchaseOrder | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) {
      return null;
    }

    const order = this.items[index];

    if (data.status) {
      order.status = data.status;
    }
    if (data.expectedDate !== undefined) {
      order.expectedDate = data.expectedDate;
    }
    if (data.receivedDate !== undefined) {
      order.receivedDate = data.receivedDate;
    }
    if (data.notes !== undefined) {
      order.notes = data.notes;
    }

    return order;
  }

  async save(order: PurchaseOrder): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(order.id));

    if (index !== -1) {
      this.items[index] = order;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));

    if (index !== -1) {
      this.items[index].delete();
    }
  }
}
