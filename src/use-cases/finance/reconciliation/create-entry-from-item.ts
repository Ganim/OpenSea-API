import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type BankReconciliationItemDTO,
  bankReconciliationItemToDTO,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-to-dto';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface CreateEntryFromItemUseCaseRequest {
  tenantId: string;
  reconciliationId: string;
  itemId: string;
  categoryId: string;
  createdBy?: string;
}

interface CreateEntryFromItemUseCaseResponse {
  item: BankReconciliationItemDTO;
  entryId: string;
}

export class CreateEntryFromItemUseCase {
  constructor(
    private bankReconciliationsRepository: BankReconciliationsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: CreateEntryFromItemUseCaseRequest,
  ): Promise<CreateEntryFromItemUseCaseResponse> {
    const { tenantId, reconciliationId, itemId, categoryId, createdBy } =
      request;

    // Validate reconciliation exists
    const reconciliation = await this.bankReconciliationsRepository.findById(
      new UniqueEntityID(reconciliationId),
      tenantId,
    );

    if (!reconciliation) {
      throw new ResourceNotFoundError(
        'Reconciliation not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    if (reconciliation.isCompleted) {
      throw new BadRequestError(
        'Cannot modify a completed reconciliation',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Validate item exists
    const item = await this.bankReconciliationsRepository.findItemById(
      new UniqueEntityID(itemId),
      reconciliationId,
    );

    if (!item) {
      throw new ResourceNotFoundError(
        'Reconciliation item not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    if (item.isMatched || item.matchStatus === 'CREATED') {
      throw new BadRequestError(
        'Item is already matched or has a created entry',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Determine entry type: DEBIT -> PAYABLE, CREDIT -> RECEIVABLE
    const entryType = item.type === 'DEBIT' ? 'PAYABLE' : 'RECEIVABLE';

    // Generate code for the new entry
    const entryCode = await this.financeEntriesRepository.generateNextCode(
      tenantId,
      entryType,
    );

    // Create finance entry
    const financeEntry = await this.financeEntriesRepository.create({
      tenantId,
      type: entryType,
      code: entryCode,
      description: item.description,
      categoryId,
      bankAccountId: reconciliation.bankAccountId.toString(),
      expectedAmount: item.amount,
      issueDate: item.transactionDate,
      dueDate: item.transactionDate,
      status: 'PENDING',
      createdBy,
    });

    // Update item to CREATED status
    const updatedItem = await this.bankReconciliationsRepository.updateItem({
      id: new UniqueEntityID(itemId),
      tenantId,
      matchedEntryId: financeEntry.id.toString(),
      matchConfidence: 1.0,
      matchStatus: 'CREATED',
    });

    // Recalculate counts
    const fullReconciliation =
      await this.bankReconciliationsRepository.findById(
        new UniqueEntityID(reconciliationId),
        tenantId,
        true,
      );

    if (fullReconciliation?.items) {
      const matchedCount = fullReconciliation.items.filter(
        (i) => i.isMatched || i.matchStatus === 'CREATED',
      ).length;
      const unmatchedCount = fullReconciliation.items.filter(
        (i) => i.isUnmatched,
      ).length;

      await this.bankReconciliationsRepository.update({
        id: new UniqueEntityID(reconciliationId),
        tenantId,
        matchedCount,
        unmatchedCount,
      });
    }

    return {
      item: bankReconciliationItemToDTO(updatedItem!),
      entryId: financeEntry.id.toString(),
    };
  }
}
