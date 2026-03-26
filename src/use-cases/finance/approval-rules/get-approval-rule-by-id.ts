import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceApprovalRuleDTO,
  financeApprovalRuleToDTO,
} from '@/mappers/finance/finance-approval-rule/finance-approval-rule-to-dto';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';

interface GetApprovalRuleByIdRequest {
  id: string;
  tenantId: string;
}

interface GetApprovalRuleByIdResponse {
  rule: FinanceApprovalRuleDTO;
}

export class GetApprovalRuleByIdUseCase {
  constructor(
    private approvalRulesRepository: FinanceApprovalRulesRepository,
  ) {}

  async execute(
    request: GetApprovalRuleByIdRequest,
  ): Promise<GetApprovalRuleByIdResponse> {
    const rule = await this.approvalRulesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!rule) {
      throw new ResourceNotFoundError('Approval rule not found');
    }

    return { rule: financeApprovalRuleToDTO(rule) };
  }
}
