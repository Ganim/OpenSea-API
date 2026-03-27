import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LeadRoutingRule } from '@/entities/sales/lead-routing-rule';
import type { LeadRoutingStrategy } from '@/entities/sales/lead-routing-rule';

export function leadRoutingRulePrismaToDomain(record: {
  id: string;
  tenantId: string;
  name: string;
  strategy: string;
  config: unknown;
  assignToUsers: string[];
  maxLeadsPerUser: number | null;
  lastAssignedIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): LeadRoutingRule {
  return LeadRoutingRule.create(
    {
      tenantId: new UniqueEntityID(record.tenantId),
      name: record.name,
      strategy: record.strategy as LeadRoutingStrategy,
      config: (record.config as Record<string, unknown>) ?? {},
      assignToUsers: record.assignToUsers,
      maxLeadsPerUser: record.maxLeadsPerUser ?? undefined,
      lastAssignedIndex: record.lastAssignedIndex,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt ?? undefined,
    },
    new UniqueEntityID(record.id),
  );
}
