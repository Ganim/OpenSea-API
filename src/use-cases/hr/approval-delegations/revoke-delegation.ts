import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import type { ApprovalDelegationsRepository } from '@/repositories/hr/approval-delegations-repository';

export interface RevokeDelegationInput {
  tenantId: string;
  delegationId: string;
  revokedBy: string;
}

export interface RevokeDelegationOutput {
  delegation: ApprovalDelegation;
}

export class RevokeDelegationUseCase {
  constructor(
    private approvalDelegationsRepository: ApprovalDelegationsRepository,
  ) {}

  async execute(
    input: RevokeDelegationInput,
  ): Promise<RevokeDelegationOutput> {
    const { tenantId, delegationId, revokedBy } = input;

    const delegation = await this.approvalDelegationsRepository.findById(
      new UniqueEntityID(delegationId),
      tenantId,
    );

    if (!delegation) {
      throw new ResourceNotFoundError('Approval delegation not found');
    }

    // Only the delegator can revoke their own delegation
    if (delegation.delegatorId.toString() !== revokedBy) {
      throw new BadRequestError(
        'Only the delegator can revoke their own delegation',
      );
    }

    if (!delegation.isActive) {
      throw new BadRequestError('Delegation is already revoked');
    }

    delegation.revoke();

    await this.approvalDelegationsRepository.save(delegation);

    return { delegation };
  }
}
