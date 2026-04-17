import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
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
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: AcceptReconciliationSuggestionUseCaseRequest,
  ): Promise<AcceptReconciliationSuggestionUseCaseResponse> {
    const { tenantId, suggestionId, userId } = request;

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

    const runAccept = async (tx?: TransactionClient) => {
      const lockedEntry = tx
        ? await this.financeEntriesRepository.findByIdForUpdate(
            suggestion.entryId,
            tenantId,
            tx,
          )
        : await this.financeEntriesRepository.findById(
            suggestion.entryId,
            tenantId,
          );

      if (!lockedEntry) {
        throw new ResourceNotFoundError(
          'Finance entry not found',
          ErrorCodes.RESOURCE_NOT_FOUND,
        );
      }

      await this.bankReconciliationsRepository.updateItem(
        {
          id: suggestion.transactionId,
          tenantId: suggestion.tenantId.toString(),
          matchedEntryId: suggestion.entryId.toString(),
          matchConfidence: suggestion.score / 110,
          matchStatus: 'SUGGESTION_ACCEPTED',
        },
        tx,
      );

      const existingPaymentsSum =
        await this.financeEntryPaymentsRepository.sumByEntryId(
          suggestion.entryId,
          tx,
        );

      const remainingBalance = lockedEntry.totalDue - existingPaymentsSum;

      if (remainingBalance > 0) {
        const paymentAmount = Math.min(
          lockedEntry.expectedAmount,
          remainingBalance,
        );

        await this.financeEntryPaymentsRepository.create(
          {
            entryId: suggestion.entryId.toString(),
            amount: paymentAmount,
            paidAt: new Date(),
            method: 'BANK_RECONCILIATION',
            notes: `Auto-conciliação aceita (score: ${suggestion.score})`,
            createdBy: userId,
          },
          tx,
        );

        const newTotal = existingPaymentsSum + paymentAmount;
        const isFullyPaid = newTotal >= lockedEntry.totalDue;

        if (isFullyPaid) {
          const fullyPaidStatus =
            lockedEntry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
          await this.financeEntriesRepository.update(
            {
              id: suggestion.entryId,
              tenantId,
              status: fullyPaidStatus,
              actualAmount: newTotal,
              paymentDate: new Date(),
            },
            tx,
          );
        } else {
          await this.financeEntriesRepository.update(
            {
              id: suggestion.entryId,
              tenantId,
              status: 'PARTIALLY_PAID',
              actualAmount: newTotal,
            },
            tx,
          );
        }
      }

      const updatedSuggestion =
        await this.reconciliationSuggestionsRepository.updateStatus(
          new UniqueEntityID(suggestionId),
          'ACCEPTED',
          userId,
          tx,
        );

      return updatedSuggestion!;
    };

    const updated = this.transactionManager
      ? await this.transactionManager.run((tx) => runAccept(tx))
      : await runAccept();

    return {
      suggestion: reconciliationSuggestionToDTO(updated),
    };
  }
}
