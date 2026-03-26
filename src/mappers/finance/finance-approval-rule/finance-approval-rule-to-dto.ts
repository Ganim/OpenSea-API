import type { FinanceApprovalRule } from '@/entities/finance/finance-approval-rule';

export interface FinanceApprovalRuleDTO {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  action: string;
  maxAmount?: number;
  conditions: Record<string, unknown>;
  priority: number;
  appliedCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

export function financeApprovalRuleToDTO(
  rule: FinanceApprovalRule,
): FinanceApprovalRuleDTO {
  return {
    id: rule.id.toString(),
    tenantId: rule.tenantId.toString(),
    name: rule.name,
    isActive: rule.isActive,
    action: rule.action,
    maxAmount: rule.maxAmount,
    conditions: rule.conditions as Record<string, unknown>,
    priority: rule.priority,
    appliedCount: rule.appliedCount,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}
