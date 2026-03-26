import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  FinanceApprovalRule,
  type FinanceApprovalAction,
  type FinanceApprovalRuleConditions,
} from '@/entities/finance/finance-approval-rule';
import type { FinanceApprovalRule as PrismaFinanceApprovalRule } from '@prisma/generated/client.js';

export function financeApprovalRulePrismaToDomain(
  raw: PrismaFinanceApprovalRule,
): FinanceApprovalRule {
  return FinanceApprovalRule.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      isActive: raw.isActive,
      action: raw.action as FinanceApprovalAction,
      maxAmount: raw.maxAmount ? Number(raw.maxAmount) : undefined,
      conditions: (raw.conditions as FinanceApprovalRuleConditions) ?? {},
      priority: raw.priority,
      appliedCount: raw.appliedCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
