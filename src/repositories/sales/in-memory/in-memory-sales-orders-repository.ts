import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrder, SalesOrderItem } from '@/entities/sales/sales-order';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import type {
  CreateSalesOrderSchema,
  SalesOrdersRepository,
  UpdateSalesOrderSchema,
} from '../sales-orders-repository';

export class InMemorySalesOrdersRepository implements SalesOrdersRepository {
  public items: SalesOrder[] = [];

  async create(data: CreateSalesOrderSchema): Promise<SalesOrder> {
    const order = SalesOrder.create({
      orderNumber: data.orderNumber,
      customerId: data.customerId,
      createdBy: data.createdBy,
      status: data.status,
      discount: data.discount ?? 0,
      notes: data.notes,
      items: [],
    });

    // Add items to the order
    if (data.items && data.items.length > 0) {
      for (const itemData of data.items) {
        const item = SalesOrderItem.create({
          orderId: order.id,
          variantId: itemData.variantId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          discount: itemData.discount ?? 0,
          notes: itemData.notes,
        });
        order.addItem(item);
      }
    }

    this.items.push(order);
    return order;
  }

  async findById(id: UniqueEntityID): Promise<SalesOrder | null> {
    const order = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return order ?? null;
  }

  async findByOrderNumber(orderNumber: string): Promise<SalesOrder | null> {
    const order = this.items.find(
      (item) => !item.deletedAt && item.orderNumber === orderNumber,
    );
    return order ?? null;
  }

  async findManyByStatus(
    status: OrderStatus,
    page: number,
    perPage: number,
  ): Promise<SalesOrder[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((item) => !item.deletedAt && item.status.value === status.value)
      .slice(start, start + perPage);
  }

  async findManyByCustomer(
    customerId: UniqueEntityID,
    page: number,
    perPage: number,
  ): Promise<SalesOrder[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((item) => !item.deletedAt && item.customerId.equals(customerId))
      .slice(start, start + perPage);
  }

  async update(data: UpdateSalesOrderSchema): Promise<SalesOrder | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) {
      return null;
    }

    const order = this.items[index];

    if (data.status !== undefined) order.status = data.status;
    if (data.discount !== undefined) order.discount = data.discount;
    if (data.notes !== undefined) order.notes = data.notes;

    return order;
  }

  async save(order: SalesOrder): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(order.id));

    if (index >= 0) {
      this.items[index] = order;
    } else {
      this.items.push(order);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const order = await this.findById(id);

    if (order) {
      order.delete();
    }
  }
}
