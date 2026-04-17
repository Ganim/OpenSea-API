import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  BankConnectionRecord,
  BankConnectionsRepository,
} from '@/repositories/finance/bank-connections-repository';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankingProvider } from '@/services/banking/pluggy-provider.interface';
import { autoMatchTransactions } from '../reconciliation/auto-match-transactions';

interface SyncBankTransactionsUseCaseRequest {
  tenantId: string;
  connectionId: string;
}

interface SyncBankTransactionsUseCaseResponse {
  connection: BankConnectionRecord;
  transactionsImported: number;
  matchedCount: number;
}

export class SyncBankTransactionsUseCase {
  constructor(
    private bankConnectionsRepository: BankConnectionsRepository,
    private bankReconciliationsRepository: BankReconciliationsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankingProvider: BankingProvider,
  ) {}

  async execute(
    request: SyncBankTransactionsUseCaseRequest,
  ): Promise<SyncBankTransactionsUseCaseResponse> {
    const { tenantId, connectionId } = request;

    // Find connection
    const connection = await this.bankConnectionsRepository.findById(
      new UniqueEntityID(connectionId),
      tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError(
        'Bank connection not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Get accounts from Pluggy
    const accounts = await this.bankingProvider.getAccounts(
      connection.externalItemId,
    );

    if (accounts.length === 0) {
      // Update lastSyncAt even with no accounts
      const updatedConnection = await this.bankConnectionsRepository.update({
        id: new UniqueEntityID(connectionId),
        tenantId,
        lastSyncAt: new Date(),
      });

      return {
        connection: updatedConnection!,
        transactionsImported: 0,
        matchedCount: 0,
      };
    }

    // Sync last 30 days of transactions
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = now.toISOString().split('T')[0];

    let totalImported = 0;
    let totalMatched = 0;

    for (const account of accounts) {
      const transactions = await this.bankingProvider.getTransactions(
        account.id,
        fromDate,
        toDate,
      );

      if (transactions.length === 0) continue;

      // Create reconciliation for this sync
      const reconciliation = await this.bankReconciliationsRepository.create({
        tenantId,
        bankAccountId: connection.bankAccountId,
        fileName: `pluggy-sync-${new Date().toISOString()}`,
        periodStart: thirtyDaysAgo,
        periodEnd: now,
        totalTransactions: transactions.length,
      });

      // Create reconciliation items.
      // Pluggy returns negative amounts for debits and positive for credits.
      // Persist `amount` as the absolute value and keep the credit/debit sign
      // in `type` so auto-match (which compares magnitudes against
      // entry.expectedAmount) can find DEBIT/PAYABLE pairs.
      const items = await this.bankReconciliationsRepository.createItems(
        transactions.map((tx) => ({
          reconciliationId: reconciliation.id.toString(),
          fitId: tx.id,
          transactionDate: new Date(tx.date),
          amount: Math.abs(tx.amount),
          description: tx.description,
          type: tx.amount < 0 ? 'DEBIT' : 'CREDIT',
        })),
      );

      totalImported += transactions.length;

      // Auto-match
      const { entries: candidateEntries } =
        await this.financeEntriesRepository.findMany({
          tenantId,
          bankAccountId: connection.bankAccountId,
          dueDateFrom: thirtyDaysAgo,
          dueDateTo: now,
          limit: 1000,
        });

      const matchResults = autoMatchTransactions(items, candidateEntries);

      // Track matches scoped to THIS account/reconciliation only.
      // Using the global counter would leak prior accounts' matches into
      // every reconciliation row.
      let accountMatched = 0;

      for (const [itemId, match] of matchResults) {
        await this.bankReconciliationsRepository.updateItem({
          id: new UniqueEntityID(itemId),
          tenantId,
          matchedEntryId: match.entryId,
          matchConfidence: match.confidence,
          matchStatus: 'AUTO_MATCHED',
        });
        accountMatched++;
      }

      totalMatched += accountMatched;

      // Update reconciliation with this account's own match counts
      await this.bankReconciliationsRepository.update({
        id: reconciliation.id,
        tenantId,
        matchedCount: accountMatched,
        unmatchedCount: transactions.length - accountMatched,
        status: 'IN_PROGRESS',
      });
    }

    // Update connection lastSyncAt
    const updatedConnection = await this.bankConnectionsRepository.update({
      id: new UniqueEntityID(connectionId),
      tenantId,
      lastSyncAt: new Date(),
    });

    return {
      connection: updatedConnection!,
      transactionsImported: totalImported,
      matchedCount: totalMatched,
    };
  }
}
