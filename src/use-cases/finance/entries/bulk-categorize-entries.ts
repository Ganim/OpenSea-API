import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface BulkCategorizeEntriesUseCaseRequest {
  tenantId: string;
  entryIds: string[];
  categoryId: string;
  userId?: string;
}

interface BulkEntryError {
  entryId: string;
  error: string;
}

interface BulkCategorizeEntriesUseCaseResponse {
  succeeded: number;
  failed: number;
  errors: BulkEntryError[];
}

export class BulkCategorizeEntriesUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
    private transactionManager: TransactionManager,
    private approvalRulesRepository?: FinanceApprovalRulesRepository,
  ) {}

  async execute(
    request: BulkCategorizeEntriesUseCaseRequest,
  ): Promise<BulkCategorizeEntriesUseCaseResponse> {
    const { tenantId, entryIds, categoryId, userId } = request;

    // Validate category exists and belongs to tenant before starting transaction
    const category = await this.financeCategoriesRepository.findById(
      new UniqueEntityID(categoryId),
      tenantId,
    );

    if (!category) {
      throw new ResourceNotFoundError('Finance category not found');
    }

    if (!category.isActive) {
      throw new BadRequestError(
        'Cannot assign entries to an inactive category',
      );
    }

    const errors: BulkEntryError[] = [];
    let succeededCount = 0;

    await this.transactionManager.run(async (tx: TransactionClient) => {
      for (const entryId of entryIds) {
        try {
          const entry = await this.financeEntriesRepository.findById(
            new UniqueEntityID(entryId),
            tenantId,
            tx,
          );

          if (!entry) {
            errors.push({ entryId, error: 'Entry not found' });
            continue;
          }

          // Check approval rules
          if (this.approvalRulesRepository) {
            const approvalRules =
              await this.approvalRulesRepository.findActiveByTenant(tenantId);

            const requiresApproval = approvalRules.some(
              (rule) =>
                rule.action === 'FLAG_REVIEW' &&
                (!rule.maxAmount || entry.expectedAmount <= rule.maxAmount),
            );

            if (
              requiresApproval &&
              !entry.tags.includes('auto-approved') &&
              !entry.tags.includes('manually-approved')
            ) {
              errors.push({
                entryId,
                error: 'Lancamento requer aprovacao antes da categorizacao',
              });
              continue;
            }
          }

          await this.financeEntriesRepository.update(
            {
              id: new UniqueEntityID(entryId),
              tenantId,
              categoryId,
            },
            tx,
          );

          succeededCount++;
        } catch (entryError) {
          const errorMessage =
            entryError instanceof Error
              ? entryError.message
              : 'Unknown error during categorization';
          errors.push({ entryId, error: errorMessage });
        }
      }
    });

    queueAuditLog({
      userId,
      action: 'FINANCE_ENTRY_BULK_CATEGORIZE',
      entity: 'FINANCE_ENTRY',
      entityId: entryIds[0],
      module: 'FINANCE',
      description: `Bulk categorized ${succeededCount} finance entries to category ${category.name}`,
      newData: {
        entryIds,
        categoryId,
        categoryName: category.name,
        succeeded: succeededCount,
        failed: errors.length,
      },
    }).catch(() => {});

    return {
      succeeded: succeededCount,
      failed: errors.length,
      errors,
    };
  }
}
