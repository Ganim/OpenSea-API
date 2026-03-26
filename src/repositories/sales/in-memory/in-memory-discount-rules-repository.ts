import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountRule } from '@/entities/sales/discount-rule';
import type {
  CreateDiscountRuleSchema,
  DiscountRulesRepository,
} from '../discount-rules-repository';

export class InMemoryDiscountRulesRepository implements DiscountRulesRepository {
  public items: DiscountRule[] = [];

  async create(data: CreateDiscountRuleSchema): Promise<DiscountRule> {
    const discountRule = DiscountRule.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      minOrderValue: data.minOrderValue,
      minQuantity: data.minQuantity,
      categoryId: data.categoryId,
      productId: data.productId,
      customerId: data.customerId,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? true,
      priority: data.priority ?? 0,
      isStackable: data.isStackable ?? false,
    });

    this.items.push(discountRule);
    return discountRule;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<DiscountRule | null> {
    const discountRule = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return discountRule ?? null;
  }

  async findMany(page: number, perPage: number, tenantId: string): Promise<DiscountRule[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((item) => !item.deletedAt && item.tenantId.toString() === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async findActiveByTenant(tenantId: string): Promise<DiscountRule[]> {
    const now = new Date();
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        item.tenantId.toString() === tenantId &&
        now >= item.startDate &&
        now <= item.endDate,
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    ).length;
  }

  async save(discountRule: DiscountRule): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(discountRule.id));
    if (index >= 0) {
      this.items[index] = discountRule;
    } else {
      this.items.push(discountRule);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const discountRule = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (discountRule) {
      discountRule.delete();
    }
  }
}
