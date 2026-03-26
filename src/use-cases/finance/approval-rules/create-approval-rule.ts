import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { FinanceApprovalAction } from '@/entities/finance/finance-approval-rule';
import {
  type FinanceApprovalRuleDTO,
  financeApprovalRuleToDTO,
} from '@/mappers/finance/finance-approval-rule/finance-approval-rule-to-dto';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';

interface CreateApprovalRuleRequest {
  tenantId: string;
  name: string;
  isActive?: boolean;
  action: FinanceApprovalAction;
  maxAmount?: number;
  conditions?: {
    categoryIds?: string[];
    supplierNames?: string[];
    entryType?: 'PAYABLE' | 'RECEIVABLE';
    minRecurrence?: number;
  };
  priority?: number;
}

interface CreateApprovalRuleResponse {
  rule: FinanceApprovalRuleDTO;
}

export class CreateApprovalRuleUseCase {
  constructor(
    private approvalRulesRepository: FinanceApprovalRulesRepository,
  ) {}

  async execute(
    request: CreateApprovalRuleRequest,
  ): Promise<CreateApprovalRuleResponse> {
    const { tenantId, name, action } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Rule name is required');
    }

    if (!['AUTO_PAY', 'AUTO_APPROVE', 'FLAG_REVIEW'].includes(action)) {
      throw new BadRequestError('Invalid approval action');
    }

    if (request.maxAmount !== undefined && request.maxAmount <= 0) {
      throw new BadRequestError('Max amount must be positive');
    }

    // Check unique name per tenant
    const existing = await this.approvalRulesRepository.findByName(
      name.trim(),
      tenantId,
    );
    if (existing) {
      throw new BadRequestError('A rule with this name already exists');
    }

    const rule = await this.approvalRulesRepository.create({
      tenantId,
      name: name.trim(),
      isActive: request.isActive,
      action,
      maxAmount: request.maxAmount,
      conditions: request.conditions as Record<string, unknown>,
      priority: request.priority,
    });

    return { rule: financeApprovalRuleToDTO(rule) };
  }
}
