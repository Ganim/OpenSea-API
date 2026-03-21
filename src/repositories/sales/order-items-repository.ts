import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderItem } from '@/entities/sales/order-item';

export interface OrderItemsRepository {
  create(item: OrderItem): Promise<void>;
  createMany(items: OrderItem[]): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<OrderItem | null>;
  findManyByOrder(orderId: UniqueEntityID, tenantId: string): Promise<OrderItem[]>;
  save(item: OrderItem): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  deleteByOrder(orderId: UniqueEntityID, tenantId: string): Promise<void>;
}
