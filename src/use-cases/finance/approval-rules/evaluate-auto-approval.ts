import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  FinanceApprovalAction,
  FinanceApprovalRule,
  FinanceApprovalRuleConditions,
} from '@/entities/finance/finance-approval-rule';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import { logger } from '@/lib/logger';
import {
  type FinanceApprovalRuleDTO,
  financeApprovalRuleToDTO,
} from '@/mappers/finance/finance-approval-rule/finance-approval-rule-to-dto';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { RegisterPaymentUseCase } from '@/use-cases/finance/entries/register-payment';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface EvaluateAutoApprovalRequest {
  entryId: string;
  tenantId: string;
  createdBy?: string;
}

interface EvaluateAutoApprovalResponse {
  matched: boolean;
  rule?: FinanceApprovalRuleDTO;
  action?: FinanceApprovalAction;
}

export class EvaluateAutoApprovalUseCase {
  constructor(
    private approvalRulesRepository: FinanceApprovalRulesRepository,
    private entriesRepository: FinanceEntriesRepository,
    private registerPaymentUseCase?: RegisterPaymentUseCase,
  ) {}

  async execute(
    request: EvaluateAutoApprovalRequest,
  ): Promise<EvaluateAutoApprovalResponse> {
    const { entryId, tenantId, createdBy } = request;

    // Load all active rules sorted by priority desc
    const rules =
      await this.approvalRulesRepository.findActiveByTenant(tenantId);

    if (rules.length === 0) {
      return { matched: false };
    }

    // Load the entry
    const entry = await this.entriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      return { matched: false };
    }

    // Entry must be PENDING to be auto-processed
    if (entry.status !== 'PENDING') {
      return { matched: false };
    }

    // Find first matching rule
    for (const rule of rules) {
      if (await this.matchesRule(rule, entry, tenantId)) {
        // Execute action
        await this.executeAction(rule, entry, tenantId, createdBy);

        // Increment applied count
        await this.approvalRulesRepository.incrementAppliedCount(rule.id);

        // Audit log
        queueAuditLog({
          userId: createdBy,
          action: 'FINANCE_APPROVAL_RULE_APPLIED',
          entity: 'FINANCE_ENTRY',
          entityId: entryId,
          module: 'FINANCE',
          description: `Regra '${rule.name}' aplicada: ${rule.action}`,
          metadata: {
            ruleId: rule.id.toString(),
            ruleName: rule.name,
            action: rule.action,
            entryCode: entry.code,
          },
        }).catch((err) => {
          logger.warn(
            {
              err,
              context: 'EvaluateAutoApprovalUseCase.queueAuditLog',
              entryId,
              ruleId: rule.id.toString(),
            },
            'Failed to queue audit log for auto-approval rule application',
          );
        });

        return {
          matched: true,
          rule: financeApprovalRuleToDTO(rule),
          action: rule.action,
        };
      }
    }

    return { matched: false };
  }

  private async matchesRule(
    rule: FinanceApprovalRule,
    entry: FinanceEntry,
    tenantId: string,
  ): Promise<boolean> {
    const conditions = rule.conditions as FinanceApprovalRuleConditions;

    // Check maxAmount: entry amount must be <= maxAmount
    if (rule.maxAmount !== undefined && rule.maxAmount !== null) {
      if (entry.expectedAmount > rule.maxAmount) {
        return false;
      }
    }

    // Check entryType
    if (conditions.entryType) {
      if (entry.type !== conditions.entryType) {
        return false;
      }
    }

    // Check categoryIds
    if (conditions.categoryIds && conditions.categoryIds.length > 0) {
      if (!conditions.categoryIds.includes(entry.categoryId.toString())) {
        return false;
      }
    }

    // Check supplierNames
    if (conditions.supplierNames && conditions.supplierNames.length > 0) {
      if (
        !entry.supplierName ||
        !conditions.supplierNames.some(
          (name) => name.toLowerCase() === entry.supplierName?.toLowerCase(),
        )
      ) {
        return false;
      }
    }

    // Check minRecurrence: supplier must have >= N previous entries
    if (conditions.minRecurrence && conditions.minRecurrence > 0) {
      if (!entry.supplierName) {
        return false;
      }

      const { total } = await this.entriesRepository.findMany({
        tenantId,
        supplierName: entry.supplierName,
        limit: 1,
      });

      // total includes the current entry, so subtract 1
      if (total - 1 < conditions.minRecurrence) {
        return false;
      }
    }

    return true;
  }

  private async executeAction(
    rule: FinanceApprovalRule,
    entry: FinanceEntry,
    tenantId: string,
    createdBy?: string,
  ): Promise<void> {
    switch (rule.action) {
      case 'AUTO_PAY': {
        if (this.registerPaymentUseCase) {
          try {
            await this.registerPaymentUseCase.execute({
              entryId: entry.id.toString(),
              tenantId,
              amount: entry.expectedAmount,
              paidAt: new Date(),
              method: 'TRANSFER',
              notes: `Pagamento automático via regra: ${rule.name}`,
              createdBy,
            });
          } catch (err) {
            logger.warn(
              {
                err,
                context: 'EvaluateAutoApprovalUseCase.AUTO_PAY',
                entryId: entry.id.toString(),
                ruleId: rule.id.toString(),
                ruleName: rule.name,
              },
              'Auto-pay failed while applying approval rule; entry remained unpaid.',
            );
          }
        }
        break;
      }
      case 'AUTO_APPROVE': {
        const currentTags = [...entry.tags];
        if (!currentTags.includes('auto-approved')) {
          currentTags.push('auto-approved');
        }
        await this.entriesRepository.update({
          id: entry.id,
          tenantId,
          tags: currentTags,
        });
        break;
      }
      case 'FLAG_REVIEW': {
        const tags = [...entry.tags];
        if (!tags.includes('review-required')) {
          tags.push('review-required');
        }
        await this.entriesRepository.update({
          id: entry.id,
          tenantId,
          tags,
        });
        break;
      }
    }
  }
}
