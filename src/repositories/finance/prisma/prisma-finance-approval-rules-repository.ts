import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { financeApprovalRulePrismaToDomain } from '@/mappers/finance/finance-approval-rule/finance-approval-rule-prisma-to-domain';
import { Prisma } from '@prisma/generated/client.js';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceApprovalRule } from '@/entities/finance/finance-approval-rule';
import type {
  FinanceApprovalRulesRepository,
  CreateFinanceApprovalRuleSchema,
  UpdateFinanceApprovalRuleSchema,
  FindManyApprovalRulesOptions,
  FindManyApprovalRulesResult,
} from '../finance-approval-rules-repository';

export class PrismaFinanceApprovalRulesRepository
  implements FinanceApprovalRulesRepository
{
  private getClient(tx?: TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: CreateFinanceApprovalRuleSchema,
    tx?: TransactionClient,
  ): Promise<FinanceApprovalRule> {
    const client = this.getClient(tx);

    const raw = await client.financeApprovalRule.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        isActive: data.isActive ?? true,
        action: data.action,
        maxAmount: data.maxAmount,
        conditions: (data.conditions ?? {}) as Prisma.InputJsonValue,
        priority: data.priority ?? 0,
      },
    });

    return financeApprovalRulePrismaToDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceApprovalRule | null> {
    const raw = await prisma.financeApprovalRule.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) return null;
    return financeApprovalRulePrismaToDomain(raw);
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<FinanceApprovalRule | null> {
    const raw = await prisma.financeApprovalRule.findFirst({
      where: { name, tenantId, deletedAt: null },
    });

    if (!raw) return null;
    return financeApprovalRulePrismaToDomain(raw);
  }

  async findMany(
    options: FindManyApprovalRulesOptions,
  ): Promise<FindManyApprovalRulesResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FinanceApprovalRuleWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
    };
    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options.action !== undefined) {
      where.action = options.action;
    }

    const [rawList, total] = await Promise.all([
      prisma.financeApprovalRule.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.financeApprovalRule.count({ where }),
    ]);

    const rules = rawList.map(financeApprovalRulePrismaToDomain);
    return { rules, total };
  }

  async findActiveByTenant(tenantId: string): Promise<FinanceApprovalRule[]> {
    const rawList = await prisma.financeApprovalRule.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { priority: 'desc' },
    });

    return rawList.map(financeApprovalRulePrismaToDomain);
  }

  async update(
    data: UpdateFinanceApprovalRuleSchema,
    tx?: TransactionClient,
  ): Promise<FinanceApprovalRule | null> {
    const client = this.getClient(tx);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.action !== undefined) updateData.action = data.action;
    if (data.maxAmount !== undefined) {
      updateData.maxAmount = data.maxAmount;
    }
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const result = await client.financeApprovalRule.updateMany({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
        deletedAt: null,
      },
      data: updateData,
    });

    if (result.count === 0) return null;

    const raw = await client.financeApprovalRule.findUnique({
      where: { id: data.id.toString() },
    });

    return raw ? financeApprovalRulePrismaToDomain(raw) : null;
  }

  async incrementAppliedCount(
    id: UniqueEntityID,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.financeApprovalRule.update({
      where: { id: id.toString() },
      data: { appliedCount: { increment: 1 } },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.financeApprovalRule.updateMany({
      where: { id: id.toString(), tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
