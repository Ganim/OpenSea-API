import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { LeadRoutingRule } from '@/entities/sales/lead-routing-rule';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CreateLeadRoutingRuleSchema,
  FindManyLeadRoutingRulesParams,
  LeadRoutingRulesRepository,
  UpdateLeadRoutingRuleSchema,
} from '../lead-routing-rules-repository';

export class InMemoryLeadRoutingRulesRepository
  implements LeadRoutingRulesRepository
{
  public items: LeadRoutingRule[] = [];

  async create(data: CreateLeadRoutingRuleSchema): Promise<LeadRoutingRule> {
    const rule = LeadRoutingRule.create({
      tenantId: new EntityID(data.tenantId),
      name: data.name,
      strategy: data.strategy,
      config: data.config ?? {},
      assignToUsers: data.assignToUsers ?? [],
      maxLeadsPerUser: data.maxLeadsPerUser,
      isActive: data.isActive ?? true,
    });

    this.items.push(rule);
    return rule;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadRoutingRule | null> {
    const rule = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return rule ?? null;
  }

  async findManyPaginated(
    params: FindManyLeadRoutingRulesParams,
  ): Promise<PaginatedResult<LeadRoutingRule>> {
    let filtered = this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === params.tenantId,
    );

    if (params.strategy) {
      filtered = filtered.filter((item) => item.strategy === params.strategy);
    }

    if (params.isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === params.isActive);
    }

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(search),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const paginatedRules = filtered.slice(start, start + params.limit);

    return {
      data: paginatedRules,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
    };
  }

  async findActiveByTenant(tenantId: string): Promise<LeadRoutingRule[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        item.tenantId.toString() === tenantId,
    );
  }

  async update(
    data: UpdateLeadRoutingRuleSchema,
  ): Promise<LeadRoutingRule | null> {
    const rule = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!rule) return null;

    if (data.name !== undefined) rule.name = data.name;
    if (data.strategy !== undefined) rule.strategy = data.strategy;
    if (data.config !== undefined) rule.config = data.config;
    if (data.assignToUsers !== undefined)
      rule.assignToUsers = data.assignToUsers;
    if (data.maxLeadsPerUser !== undefined)
      rule.maxLeadsPerUser =
        data.maxLeadsPerUser === null ? undefined : data.maxLeadsPerUser;
    if (data.isActive !== undefined) rule.isActive = data.isActive;

    return rule;
  }

  async updateLastAssignedIndex(
    id: UniqueEntityID,
    tenantId: string,
    lastAssignedIndex: number,
  ): Promise<void> {
    const rule = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (rule) {
      rule.lastAssignedIndex = lastAssignedIndex;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const rule = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (rule) {
      rule.delete();
    }
  }
}
