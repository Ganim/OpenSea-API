import type { LeadRoutingRule } from '@/entities/sales/lead-routing-rule';

export interface LeadRoutingRuleDTO {
  id: string;
  tenantId: string;
  name: string;
  strategy: string;
  config: Record<string, unknown>;
  assignToUsers: string[];
  maxLeadsPerUser?: number;
  lastAssignedIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function leadRoutingRuleToDTO(
  rule: LeadRoutingRule,
): LeadRoutingRuleDTO {
  const dto: LeadRoutingRuleDTO = {
    id: rule.id.toString(),
    tenantId: rule.tenantId.toString(),
    name: rule.name,
    strategy: rule.strategy,
    config: rule.config,
    assignToUsers: rule.assignToUsers,
    lastAssignedIndex: rule.lastAssignedIndex,
    isActive: rule.isActive,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };

  if (rule.maxLeadsPerUser !== undefined) {
    dto.maxLeadsPerUser = rule.maxLeadsPerUser;
  }

  return dto;
}
