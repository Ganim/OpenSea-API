import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ApprovalDelegation,
  DelegationScope,
} from '@/entities/hr/approval-delegation';
import type { ApprovalDelegationsRepository } from '@/repositories/hr/approval-delegations-repository';

export interface GetActiveDelegationInput {
  tenantId: string;
  delegatorId: string;
  scope?: DelegationScope;
}

export interface GetActiveDelegationOutput {
  delegations: ApprovalDelegation[];
}

export class GetActiveDelegationUseCase {
  constructor(
    private approvalDelegationsRepository: ApprovalDelegationsRepository,
  ) {}

  async execute(
    input: GetActiveDelegationInput,
  ): Promise<GetActiveDelegationOutput> {
    const { tenantId, delegatorId, scope } = input;

    const activeDelegations =
      await this.approvalDelegationsRepository.findActiveByDelegator(
        new UniqueEntityID(delegatorId),
        tenantId,
      );

    // Filter by effectiveness (active, started, not expired) and optionally by scope
    const effectiveDelegations = activeDelegations.filter((delegation) => {
      if (!delegation.isEffective()) return false;
      if (scope && !delegation.coversScope(scope)) return false;
      return true;
    });

    return { delegations: effectiveDelegations };
  }
}
