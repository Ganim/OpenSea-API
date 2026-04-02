import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountRule } from '@/entities/sales/discount-rule';

export interface CreateDiscountRuleSchema {
  tenantId: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderValue?: number;
  minQuantity?: number;
  categoryId?: string;
  productId?: string;
  customerId?: string;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  priority?: number;
  isStackable?: boolean;
}

export interface DiscountRulesRepository {
  create(data: CreateDiscountRuleSchema): Promise<DiscountRule>;
  findById(id: UniqueEntityID, tenantId: string): Promise<DiscountRule | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<DiscountRule[]>;
  findActiveByTenant(tenantId: string): Promise<DiscountRule[]>;
  countByTenant(tenantId: string): Promise<number>;
  save(discountRule: DiscountRule): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
