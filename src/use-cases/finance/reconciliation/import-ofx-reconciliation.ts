import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type BankReconciliationDTO,
  bankReconciliationToDTO,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { parseOfxFile } from '@/utils/ofx-parser';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { autoMatchTransactions } from './auto-match-transactions';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ImportOfxReconciliationUseCaseRequest {
  tenantId: string;
  bankAccountId: string;
  fileName: string;
  fileBuffer: Buffer;
}

interface ImportOfxReconciliationUseCaseResponse {
  reconciliation: BankReconciliationDTO;
}

export class ImportOfxReconciliationUseCase {
  constructor(
    private bankAccountsRepository: BankAccountsRepository,
    private bankReconciliationsRepository: BankReconciliationsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: ImportOfxReconciliationUseCaseRequest,
  ): Promise<ImportOfxReconciliationUseCaseResponse> {
    const { tenantId, bankAccountId, fileName, fileBuffer } = request;

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError(
        'OFX file exceeds maximum size of 5MB',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Validate bank account exists
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError(
        'Bank account not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Parse OFX file
    let parsedOfx;
    try {
      parsedOfx = parseOfxFile(fileBuffer);
    } catch (parseError) {
      throw new BadRequestError(
        `Failed to parse OFX file: ${(parseError as Error).message}`,
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (parsedOfx.transactions.length === 0) {
      throw new BadRequestError(
        'OFX file contains no transactions',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Create reconciliation record
    const reconciliation = await this.bankReconciliationsRepository.create({
      tenantId,
      bankAccountId,
      fileName,
      periodStart: parsedOfx.periodStart,
      periodEnd: parsedOfx.periodEnd,
      totalTransactions: parsedOfx.transactions.length,
    });

    // Create reconciliation items
    const reconciliationItems =
      await this.bankReconciliationsRepository.createItems(
        parsedOfx.transactions.map((transaction) => ({
          reconciliationId: reconciliation.id.toString(),
          fitId: transaction.fitId,
          transactionDate: transaction.transactionDate,
          amount: transaction.amount,
          description: transaction.description,
          type: transaction.type,
        })),
      );

    // Fetch finance entries for auto-matching
    // Look for entries in the period range +-3 days, associated with this bank account
    const periodStartBuffer = new Date(parsedOfx.periodStart);
    periodStartBuffer.setDate(periodStartBuffer.getDate() - 3);
    const periodEndBuffer = new Date(parsedOfx.periodEnd);
    periodEndBuffer.setDate(periodEndBuffer.getDate() + 3);

    const { entries: candidateEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        bankAccountId,
        dueDateFrom: periodStartBuffer,
        dueDateTo: periodEndBuffer,
        limit: 1000, // Reasonable limit for matching
      });

    // Run auto-matching
    const matchResults = autoMatchTransactions(
      reconciliationItems,
      candidateEntries,
    );

    // Apply matches
    let matchedCount = 0;

    for (const [itemId, match] of matchResults) {
      await this.bankReconciliationsRepository.updateItem({
        id: new UniqueEntityID(itemId),
        tenantId,
        matchedEntryId: match.entryId,
        matchConfidence: match.confidence,
        matchStatus: 'AUTO_MATCHED',
      });
      matchedCount++;
    }

    const unmatchedCount = parsedOfx.transactions.length - matchedCount;

    // Update reconciliation counts and status
    const updatedReconciliation =
      await this.bankReconciliationsRepository.update({
        id: reconciliation.id,
        tenantId,
        matchedCount,
        unmatchedCount,
        status: 'IN_PROGRESS',
      });

    // Re-fetch with items to return complete data
    const reconciliationWithItems =
      await this.bankReconciliationsRepository.findById(
        reconciliation.id,
        tenantId,
        true,
      );

    return {
      reconciliation: bankReconciliationToDTO(
        reconciliationWithItems ?? updatedReconciliation!,
      ),
    };
  }
}
