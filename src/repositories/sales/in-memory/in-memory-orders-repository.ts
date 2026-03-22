import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyOrdersPaginatedParams,
  OrdersRepository,
} from '@/repositories/sales/orders-repository';

export class InMemoryOrdersRepository implements OrdersRepository {
  public items: Order[] = [];
  private orderCounter = 0;

  async create(order: Order): Promise<void> {
    this.items.push(order);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Order | null> {
    return (
      this.items.find(
        (o) =>
          o.id.toString() === id.toString() &&
          o.tenantId.toString() === tenantId &&
          !o.isDeleted,
      ) ?? null
    );
  }

  async findByNumber(
    orderNumber: string,
    tenantId: string,
  ): Promise<Order | null> {
    return (
      this.items.find(
        (o) =>
          o.orderNumber === orderNumber &&
          o.tenantId.toString() === tenantId &&
          !o.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyOrdersPaginatedParams,
  ): Promise<PaginatedResult<Order>> {
    let filtered = this.items.filter(
      (o) => o.tenantId.toString() === params.tenantId && !o.isDeleted,
    );

    if (params.type) {
      filtered = filtered.filter((o) => o.type === params.type);
    }
    if (params.channel) {
      filtered = filtered.filter((o) => o.channel === params.channel);
    }
    if (params.stageId) {
      filtered = filtered.filter(
        (o) => o.stageId.toString() === params.stageId,
      );
    }
    if (params.pipelineId) {
      filtered = filtered.filter(
        (o) => o.pipelineId.toString() === params.pipelineId,
      );
    }
    if (params.customerId) {
      filtered = filtered.filter(
        (o) => o.customerId.toString() === params.customerId,
      );
    }
    if (params.assignedToUserId) {
      filtered = filtered.filter(
        (o) => o.assignedToUserId?.toString() === params.assignedToUserId,
      );
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((o) =>
        o.orderNumber.toLowerCase().includes(search),
      );
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(order: Order): Promise<void> {
    const index = this.items.findIndex(
      (o) => o.id.toString() === order.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = order;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const order = this.items.find((o) => o.id.toString() === id.toString());
    if (order) {
      order.delete();
    }
  }

  async getNextOrderNumber(tenantId: string): Promise<string> {
    const tenantOrders = this.items.filter(
      (o) => o.tenantId.toString() === tenantId,
    );
    this.orderCounter = Math.max(this.orderCounter, tenantOrders.length);
    this.orderCounter++;
    return `ORD-${String(this.orderCounter).padStart(4, '0')}`;
  }
}
