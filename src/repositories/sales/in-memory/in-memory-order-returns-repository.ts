import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderReturn } from '@/entities/sales/order-return';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyOrderReturnsPaginatedParams,
  OrderReturnsRepository,
} from '@/repositories/sales/order-returns-repository';

export class InMemoryOrderReturnsRepository implements OrderReturnsRepository {
  public items: OrderReturn[] = [];
  private returnCounter = 0;

  async create(orderReturn: OrderReturn): Promise<void> {
    this.items.push(orderReturn);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderReturn | null> {
    return (
      this.items.find(
        (r) =>
          r.id.toString() === id.toString() &&
          r.tenantId.toString() === tenantId &&
          !r.isDeleted,
      ) ?? null
    );
  }

  async findManyByOrder(
    orderId: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderReturn[]> {
    return this.items.filter(
      (r) =>
        r.orderId.toString() === orderId.toString() &&
        r.tenantId.toString() === tenantId &&
        !r.isDeleted,
    );
  }

  async findManyPaginated(
    params: FindManyOrderReturnsPaginatedParams,
  ): Promise<PaginatedResult<OrderReturn>> {
    let filtered = this.items.filter(
      (r) => r.tenantId.toString() === params.tenantId && !r.isDeleted,
    );

    if (params.status) {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    if (params.orderId) {
      filtered = filtered.filter(
        (r) => r.orderId.toString() === params.orderId,
      );
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.returnNumber.toLowerCase().includes(search),
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

  async save(orderReturn: OrderReturn): Promise<void> {
    const index = this.items.findIndex(
      (r) => r.id.toString() === orderReturn.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = orderReturn;
    }
  }

  async getNextReturnNumber(tenantId: string): Promise<string> {
    const tenantReturns = this.items.filter(
      (r) => r.tenantId.toString() === tenantId,
    );
    this.returnCounter = Math.max(this.returnCounter, tenantReturns.length);
    this.returnCounter++;
    return `RET-${String(this.returnCounter).padStart(4, '0')}`;
  }
}
