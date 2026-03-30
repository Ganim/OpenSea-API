import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DelegationScope } from '@/entities/hr/approval-delegation';

export function mapApprovalDelegationPrismaToDomain(
  raw: Record<string, unknown>,
) {
  return {
    tenantId: new UniqueEntityID(raw.tenantId as string),
    delegatorId: new UniqueEntityID(raw.delegatorId as string),
    delegateId: new UniqueEntityID(raw.delegateId as string),
    scope: raw.scope as DelegationScope,
    startDate: raw.startDate as Date,
    endDate: (raw.endDate as Date) ?? undefined,
    reason: (raw.reason as string) ?? undefined,
    isActive: raw.isActive as boolean,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
}
