import type { ApprovalDelegation } from '@/entities/hr/approval-delegation';

export interface ApprovalDelegationDTO {
  id: string;
  tenantId: string;
  delegatorId: string;
  delegateId: string;
  scope: string;
  startDate: Date;
  endDate: Date | null;
  reason: string | null;
  isActive: boolean;
  isEffective: boolean;
  createdAt: Date;
  updatedAt: Date;
  delegatorName?: string;
  delegateName?: string;
}

export function approvalDelegationToDTO(
  delegation: ApprovalDelegation,
  delegatorName?: string,
  delegateName?: string,
): ApprovalDelegationDTO {
  return {
    id: delegation.id.toString(),
    tenantId: delegation.tenantId.toString(),
    delegatorId: delegation.delegatorId.toString(),
    delegateId: delegation.delegateId.toString(),
    scope: delegation.scope,
    startDate: delegation.startDate,
    endDate: delegation.endDate ?? null,
    reason: delegation.reason ?? null,
    isActive: delegation.isActive,
    isEffective: delegation.isEffective(),
    createdAt: delegation.createdAt,
    updatedAt: delegation.updatedAt,
    delegatorName,
    delegateName,
  };
}
