import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceApprovalAction } from '@/entities/finance/finance-approval-rule';
import {
  type FinanceApprovalRuleDTO,
  financeApprovalRuleToDTO,
} from '@/mappers/finance/finance-approval-rule/finance-approval-rule-to-dto';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';

interface UpdateApprovalRuleRequest {
  id: string;
  tenantId: string;
  name?: string;
  isActive?: boolean;
  action?: FinanceApprovalAction;
  maxAmount?: number | null;
  conditions?: {
    categoryIds?: string[];
    supplierNames?: string[];
    entryType?: 'PAYABLE' | 'RECEIVABLE';
    minRecurrence?: number;
  };
  priority?: number;
}

interface UpdateApprovalRuleResponse {
  rule: FinanceApprovalRuleDTO;
}

export class UpdateApprovalRuleUseCase {
  constructor(
    private approvalRulesRepository: FinanceApprovalRulesRepository,
  ) {}

  async execute(
    request: UpdateApprovalRuleRequest,
  ): Promise<UpdateApprovalRuleResponse> {
    const { id, tenantId } = request;

    const existing = await this.approvalRulesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!existing) {
      throw new ResourceNotFoundError('Approval rule not found');
    }

    // Validate unique name if changing
    if (request.name && request.name.trim() !== existing.name) {
      const nameConflict = await this.approvalRulesRepository.findByName(
        request.name.trim(),
        tenantId,
      );
      if (nameConflict) {
        throw new BadRequestError('A rule with this name already exists');
      }
    }

    if (
      request.maxAmount !== undefined &&
      request.maxAmount !== null &&
      request.maxAmount <= 0
    ) {
      throw new BadRequestError('Max amount must be positive');
    }

    const updated = await this.approvalRulesRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      name: request.name?.trim(),
      isActive: request.isActive,
      action: request.action,
      maxAmount: request.maxAmount,
      conditions: request.conditions as Record<string, unknown>,
      priority: request.priority,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Approval rule not found');
    }

    return { rule: financeApprovalRuleToDTO(updated) };
  }
}
