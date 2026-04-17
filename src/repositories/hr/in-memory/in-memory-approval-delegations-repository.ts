import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import type {
  ApprovalDelegationsRepository,
  PaginatedApprovalDelegationsResult,
} from '../approval-delegations-repository';

export class InMemoryApprovalDelegationsRepository
  implements ApprovalDelegationsRepository
{
  public items: ApprovalDelegation[] = [];

  async create(delegation: ApprovalDelegation): Promise<void> {
    this.items.push(delegation);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findActiveByDelegator(
    delegatorId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation[]> {
    return this.items.filter(
      (item) =>
        item.delegatorId.equals(delegatorId) &&
        item.tenantId.toString() === tenantId &&
        item.isActive,
    );
  }

  async findActiveByDelegate(
    delegateId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation[]> {
    return this.items.filter(
      (item) =>
        item.delegateId.equals(delegateId) &&
        item.tenantId.toString() === tenantId &&
        item.isActive,
    );
  }

  async findManyByDelegator(
    delegatorId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedApprovalDelegationsResult> {
    const filtered = this.items
      .filter(
        (item) =>
          item.delegatorId.equals(delegatorId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      delegations: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }

  async findManyByDelegate(
    delegateId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedApprovalDelegationsResult> {
    const filtered = this.items
      .filter(
        (item) =>
          item.delegateId.equals(delegateId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      delegations: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }

  async findActiveDelegation(
    delegatorId: UniqueEntityID,
    delegateId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation | null> {
    return (
      this.items.find(
        (item) =>
          item.delegatorId.equals(delegatorId) &&
          item.delegateId.equals(delegateId) &&
          item.tenantId.toString() === tenantId &&
          item.isActive,
      ) ?? null
    );
  }

  async save(delegation: ApprovalDelegation): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(delegation.id) &&
        item.tenantId.toString() === delegation.tenantId.toString(),
    );
    if (index >= 0) {
      this.items[index] = delegation;
    }
  }
}
