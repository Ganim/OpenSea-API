import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ApprovalDelegation } from '@/entities/hr/approval-delegation';

export interface PaginatedApprovalDelegationsResult {
  delegations: ApprovalDelegation[];
  total: number;
}

export interface ApprovalDelegationsRepository {
  create(delegation: ApprovalDelegation): Promise<void>;

  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation | null>;

  findActiveByDelegator(
    delegatorId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation[]>;

  findActiveByDelegate(
    delegateId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation[]>;

  findManyByDelegator(
    delegatorId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedApprovalDelegationsResult>;

  findManyByDelegate(
    delegateId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedApprovalDelegationsResult>;

  findActiveDelegation(
    delegatorId: UniqueEntityID,
    delegateId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation | null>;

  save(delegation: ApprovalDelegation): Promise<void>;
}
