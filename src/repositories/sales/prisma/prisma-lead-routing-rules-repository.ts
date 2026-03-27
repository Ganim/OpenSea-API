import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LeadRoutingRule } from '@/entities/sales/lead-routing-rule';
import { prisma } from '@/lib/prisma';
import { leadRoutingRulePrismaToDomain } from '@/mappers/sales/lead-routing-rule/lead-routing-rule-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CreateLeadRoutingRuleSchema,
  FindManyLeadRoutingRulesParams,
  LeadRoutingRulesRepository,
  UpdateLeadRoutingRuleSchema,
} from '../lead-routing-rules-repository';
import type { LeadRoutingStrategy as PrismaLeadRoutingStrategy } from '@prisma/generated/client.js';

export class PrismaLeadRoutingRulesRepository
  implements LeadRoutingRulesRepository
{
  async create(data: CreateLeadRoutingRuleSchema): Promise<LeadRoutingRule> {
    const record = await prisma.leadRoutingRule.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        strategy: data.strategy as PrismaLeadRoutingStrategy,
        config: (data.config as object) ?? {},
        assignToUsers: data.assignToUsers ?? [],
        maxLeadsPerUser: data.maxLeadsPerUser ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return leadRoutingRulePrismaToDomain(record);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadRoutingRule | null> {
    const record = await prisma.leadRoutingRule.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!record) return null;
    return leadRoutingRulePrismaToDomain(record);
  }

  async findManyPaginated(
    params: FindManyLeadRoutingRulesParams,
  ): Promise<PaginatedResult<LeadRoutingRule>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.strategy) where.strategy = params.strategy;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [records, total] = await Promise.all([
      prisma.leadRoutingRule.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      prisma.leadRoutingRule.count({ where }),
    ]);

    const mappedRules = records.map(leadRoutingRulePrismaToDomain);

    return {
      data: mappedRules,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findActiveByTenant(tenantId: string): Promise<LeadRoutingRule[]> {
    const records = await prisma.leadRoutingRule.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(leadRoutingRulePrismaToDomain);
  }

  async update(
    data: UpdateLeadRoutingRuleSchema,
  ): Promise<LeadRoutingRule | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.strategy !== undefined) updateData.strategy = data.strategy;
    if (data.config !== undefined) updateData.config = data.config as object;
    if (data.assignToUsers !== undefined)
      updateData.assignToUsers = data.assignToUsers;
    if (data.maxLeadsPerUser !== undefined)
      updateData.maxLeadsPerUser = data.maxLeadsPerUser;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const record = await prisma.leadRoutingRule.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return leadRoutingRulePrismaToDomain(record);
  }

  async updateLastAssignedIndex(
    id: UniqueEntityID,
    tenantId: string,
    lastAssignedIndex: number,
  ): Promise<void> {
    await prisma.leadRoutingRule.update({
      where: { id: id.toString() },
      data: { lastAssignedIndex },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.leadRoutingRule.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
