import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import type { ApprovalDelegationsRepository } from '@/repositories/hr/approval-delegations-repository';

export interface ListDelegationsToMeInput {
  tenantId: string;
  delegateId: string;
  page: number;
  limit: number;
}

export interface ListDelegationsToMeOutput {
  delegations: ApprovalDelegation[];
  total: number;
}

export class ListDelegationsToMeUseCase {
  constructor(
    private approvalDelegationsRepository: ApprovalDelegationsRepository,
  ) {}

  async execute(
    input: ListDelegationsToMeInput,
  ): Promise<ListDelegationsToMeOutput> {
    const { tenantId, delegateId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { delegations, total } =
      await this.approvalDelegationsRepository.findManyByDelegate(
        new UniqueEntityID(delegateId),
        tenantId,
        skip,
        limit,
      );

    return { delegations, total };
  }
}
