import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';

interface DeleteApprovalRuleRequest {
  id: string;
  tenantId: string;
}

export class DeleteApprovalRuleUseCase {
  constructor(
    private approvalRulesRepository: FinanceApprovalRulesRepository,
  ) {}

  async execute(request: DeleteApprovalRuleRequest): Promise<void> {
    const existing = await this.approvalRulesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Approval rule not found');
    }

    await this.approvalRulesRepository.delete(
      new UniqueEntityID(request.id),
      request.tenantId,
    );
  }
}
