import type { FinanceApprovalAction } from '@/entities/finance/finance-approval-rule';
import {
  type FinanceApprovalRuleDTO,
  financeApprovalRuleToDTO,
} from '@/mappers/finance/finance-approval-rule/finance-approval-rule-to-dto';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';

interface ListApprovalRulesRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  action?: FinanceApprovalAction;
}

interface ListApprovalRulesResponse {
  rules: FinanceApprovalRuleDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListApprovalRulesUseCase {
  constructor(
    private approvalRulesRepository: FinanceApprovalRulesRepository,
  ) {}

  async execute(
    request: ListApprovalRulesRequest,
  ): Promise<ListApprovalRulesResponse> {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const result = await this.approvalRulesRepository.findMany({
      tenantId: request.tenantId,
      page,
      limit,
      isActive: request.isActive,
      action: request.action,
    });

    return {
      rules: result.rules.map(financeApprovalRuleToDTO),
      meta: {
        total: result.total,
        page,
        limit,
        pages: Math.ceil(result.total / limit),
      },
    };
  }
}
