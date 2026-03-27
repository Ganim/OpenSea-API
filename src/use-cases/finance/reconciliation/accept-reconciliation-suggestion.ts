import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReconciliationSuggestionDTO } from '@/mappers/finance/reconciliation-suggestion/reconciliation-suggestion-to-dto';
import { reconciliationSuggestionToDTO } from '@/mappers/finance/reconciliation-suggestion/reconciliation-suggestion-to-dto';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';
import type { ReconciliationSuggestionsRepository } from '@/repositories/finance/reconciliation-suggestions-repository';

interface AcceptReconciliationSuggestionUseCaseRequest {
  tenantId: string;
  suggestionId: string;
  userId: string;
}

interface AcceptReconciliationSuggestionUseCaseResponse {
  suggestion: ReconciliationSuggestionDTO;
}

export class AcceptReconciliationSuggestionUseCase {
  constructor(
    private reconciliationSuggestionsRepository: ReconciliationSuggestionsRepository,
    private bankReconciliationsRepository: BankReconciliationsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
  ) {}

  async execute(
    request: AcceptReconciliationSuggestionUseCaseRequest,
  ): Promise<AcceptReconciliationSuggestionUseCaseResponse> {
    const { tenantId, suggestionId, userId } = request;

    // Find the suggestion
    const suggestion = await this.reconciliationSuggestionsRepository.findById(
      new UniqueEntityID(suggestionId),
      tenantId,
    );

    if (!suggestion) {
      throw new ResourceNotFoundError(
        'Reconciliation suggestion not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    if (!suggestion.isPending) {
      throw new BadRequestError(
        'Suggestion has already been reviewed',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Validate the entry still exists
    const entry = await this.financeEntriesRepository.findById(
      suggestion.entryId,
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError(
        'Finance entry not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Mark the bank reconciliation item as matched
    await this.bankReconciliationsRepository.updateItem({
      id: suggestion.transactionId,
      matchedEntryId: suggestion.entryId.toString(),
      matchConfidence: suggestion.score / 110,
      matchStatus: 'SUGGESTION_ACCEPTED',
    });

    // Register payment on the entry if the transaction matches
    // We use the entry's expected amount as the payment amount
    const existingPaymentsSum =
      await this.financeEntryPaymentsRepository.sumByEntryId(
        suggestion.entryId,
      );

    const remainingBalance = entry.totalDue - existingPaymentsSum;

    if (remainingBalance > 0) {
      const paymentAmount = Math.min(entry.expectedAmount, remainingBalance);

      await this.financeEntryPaymentsRepository.create({
        entryId: suggestion.entryId.toString(),
        amount: paymentAmount,
        paidAt: new Date(),
        method: 'BANK_RECONCILIATION',
        notes: `Auto-conciliação aceita (score: ${suggestion.score})`,
        createdBy: userId,
      });

      // Check if entry is fully paid
      const newTotal = existingPaymentsSum + paymentAmount;
      const isFullyPaid = newTotal >= entry.totalDue;

      if (isFullyPaid) {
        const fullyPaidStatus = entry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
        await this.financeEntriesRepository.update({
          id: suggestion.entryId,
          tenantId,
          status: fullyPaidStatus,
          actualAmount: newTotal,
          paymentDate: new Date(),
        });
      } else {
        await this.financeEntriesRepository.update({
          id: suggestion.entryId,
          tenantId,
          status: 'PARTIALLY_PAID',
          actualAmount: newTotal,
        });
      }
    }

    // Mark suggestion as accepted
    const updatedSuggestion =
      await this.reconciliationSuggestionsRepository.updateStatus(
        new UniqueEntityID(suggestionId),
        'ACCEPTED',
        userId,
      );

    return {
      suggestion: reconciliationSuggestionToDTO(updatedSuggestion!),
    };
  }
}
