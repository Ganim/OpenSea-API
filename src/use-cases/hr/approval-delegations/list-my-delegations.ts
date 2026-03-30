import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import type { ApprovalDelegationsRepository } from '@/repositories/hr/approval-delegations-repository';

export interface ListMyDelegationsInput {
  tenantId: string;
  delegatorId: string;
  page: number;
  limit: number;
}

export interface ListMyDelegationsOutput {
  delegations: ApprovalDelegation[];
  total: number;
}

export class ListMyDelegationsUseCase {
  constructor(
    private approvalDelegationsRepository: ApprovalDelegationsRepository,
  ) {}

  async execute(
    input: ListMyDelegationsInput,
  ): Promise<ListMyDelegationsOutput> {
    const { tenantId, delegatorId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { delegations, total } =
      await this.approvalDelegationsRepository.findManyByDelegator(
        new UniqueEntityID(delegatorId),
        tenantId,
        skip,
        limit,
      );

    return { delegations, total };
  }
}
