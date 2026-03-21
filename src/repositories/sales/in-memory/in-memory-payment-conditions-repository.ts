import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PaymentCondition } from '@/entities/sales/payment-condition';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPaymentConditionsParams,
  PaymentConditionsRepository,
} from '@/repositories/sales/payment-conditions-repository';

export class InMemoryPaymentConditionsRepository
  implements PaymentConditionsRepository
{
  public items: PaymentCondition[] = [];

  async create(condition: PaymentCondition): Promise<void> {
    this.items.push(condition);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PaymentCondition | null> {
    return (
      this.items.find(
        (c) =>
          c.id.toString() === id.toString() &&
          c.tenantId.toString() === tenantId &&
          !c.isDeleted,
      ) ?? null
    );
  }

  async findDefault(tenantId: string): Promise<PaymentCondition | null> {
    return (
      this.items.find(
        (c) =>
          c.tenantId.toString() === tenantId &&
          c.isDefault &&
          c.isActive &&
          !c.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyPaymentConditionsParams,
  ): Promise<PaginatedResult<PaymentCondition>> {
    let filtered = this.items.filter(
      (c) => c.tenantId.toString() === params.tenantId && !c.isDeleted,
    );

    if (params.type) {
      filtered = filtered.filter((c) => c.type === params.type);
    }
    if (params.isActive !== undefined) {
      filtered = filtered.filter((c) => c.isActive === params.isActive);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(search),
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

  async save(condition: PaymentCondition): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === condition.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = condition;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const condition = this.items.find(
      (c) => c.id.toString() === id.toString(),
    );
    if (condition) {
      condition.delete();
    }
  }
}
