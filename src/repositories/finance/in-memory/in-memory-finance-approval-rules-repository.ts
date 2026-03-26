import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  FinanceApprovalRule,
  type FinanceApprovalRuleConditions,
} from '@/entities/finance/finance-approval-rule';
import type {
  CreateFinanceApprovalRuleSchema,
  FindManyApprovalRulesOptions,
  FindManyApprovalRulesResult,
  FinanceApprovalRulesRepository,
  UpdateFinanceApprovalRuleSchema,
} from '../finance-approval-rules-repository';

export class InMemoryFinanceApprovalRulesRepository
  implements FinanceApprovalRulesRepository
{
  public items: FinanceApprovalRule[] = [];

  async create(
    data: CreateFinanceApprovalRuleSchema,
  ): Promise<FinanceApprovalRule> {
    const ruleId = new UniqueEntityID();

    const rule = FinanceApprovalRule.create(
      {
        id: ruleId,
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        isActive: data.isActive ?? true,
        action: data.action,
        maxAmount: data.maxAmount,
        conditions:
          (data.conditions as FinanceApprovalRuleConditions) ?? {},
        priority: data.priority ?? 0,
      },
      ruleId,
    );

    this.items.push(rule);
    return rule;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceApprovalRule | null> {
    const found = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return found ?? null;
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<FinanceApprovalRule | null> {
    const found = this.items.find(
      (item) =>
        item.name === name &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return found ?? null;
  }

  async findMany(
    options: FindManyApprovalRulesOptions,
  ): Promise<FindManyApprovalRulesResult> {
    let filtered = this.items.filter(
      (item) =>
        item.tenantId.toString() === options.tenantId && !item.deletedAt,
    );

    if (options.isActive !== undefined) {
      filtered = filtered.filter(
        (item) => item.isActive === options.isActive,
      );
    }

    if (options.action !== undefined) {
      filtered = filtered.filter(
        (item) => item.action === options.action,
      );
    }

    const total = filtered.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const start = (page - 1) * limit;
    const rules = filtered.slice(start, start + limit);

    return { rules, total };
  }

  async findActiveByTenant(tenantId: string): Promise<FinanceApprovalRule[]> {
    return this.items
      .filter(
        (item) =>
          item.tenantId.toString() === tenantId &&
          item.isActive &&
          !item.deletedAt,
      )
      .sort((a, b) => b.priority - a.priority);
  }

  async update(
    data: UpdateFinanceApprovalRuleSchema,
  ): Promise<FinanceApprovalRule | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId &&
        !item.deletedAt,
    );
    if (index === -1) return null;

    const existing = this.items[index];
    if (data.name !== undefined) existing.name = data.name;
    if (data.isActive !== undefined) existing.isActive = data.isActive;
    if (data.action !== undefined) existing.action = data.action;
    if (data.maxAmount !== undefined) {
      existing.maxAmount = data.maxAmount === null ? undefined : data.maxAmount;
    }
    if (data.conditions !== undefined) {
      existing.conditions =
        data.conditions as FinanceApprovalRuleConditions;
    }
    if (data.priority !== undefined) existing.priority = data.priority;

    return existing;
  }

  async incrementAppliedCount(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((i) => i.id.equals(id));
    if (item) {
      item.incrementAppliedCount();
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    if (index !== -1) {
      this.items[index].props.deletedAt = new Date();
    }
  }
}
