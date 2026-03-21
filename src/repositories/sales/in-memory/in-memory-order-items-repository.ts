import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderItem } from '@/entities/sales/order-item';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';

export class InMemoryOrderItemsRepository implements OrderItemsRepository {
  public items: OrderItem[] = [];

  async create(item: OrderItem): Promise<void> {
    this.items.push(item);
  }

  async createMany(items: OrderItem[]): Promise<void> {
    this.items.push(...items);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderItem | null> {
    return (
      this.items.find(
        (i) =>
          i.id.toString() === id.toString() &&
          i.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByOrder(
    orderId: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderItem[]> {
    return this.items.filter(
      (i) =>
        i.orderId.toString() === orderId.toString() &&
        i.tenantId.toString() === tenantId,
    );
  }

  async save(item: OrderItem): Promise<void> {
    const index = this.items.findIndex(
      (i) => i.id.toString() === item.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = item;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    this.items = this.items.filter((i) => i.id.toString() !== id.toString());
  }

  async deleteByOrder(
    orderId: UniqueEntityID,
    _tenantId: string,
  ): Promise<void> {
    this.items = this.items.filter(
      (i) => i.orderId.toString() !== orderId.toString(),
    );
  }
}
