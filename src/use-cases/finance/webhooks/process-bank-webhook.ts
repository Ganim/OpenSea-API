import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type {
  BankWebhookEventRecord,
  BankWebhookEventsRepository,
} from '@/repositories/finance/bank-webhook-events-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const candidate = err as { code?: string; name?: string };
  // Prisma throws PrismaClientKnownRequestError with code P2002 on unique
  // constraint violation. In-memory repos throw a generic Error with a
  // well-known message — we support both shapes.
  if (candidate.code === 'P2002') return true;
  if ('message' in (err as object)) {
    const message = String((err as { message: string }).message ?? '');
    return /unique constraint|duplicate key|UNIQUE/i.test(message);
  }
  return false;
}

export interface ProcessBankWebhookRequest {
  tenantId: string;
  bankAccountId: string;
  provider: string;
  payload: unknown;
}

export interface ProcessBankWebhookResponse {
  event: BankWebhookEventRecord;
  matched: boolean;
  autoSettled: boolean;
}

export class ProcessBankWebhookUseCase {
  constructor(
    private webhookEventsRepository: BankWebhookEventsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private getProvider: (
      bankAccountId: string,
      providerName: string,
    ) => Promise<BankingProvider>,
  ) {}

  async execute(
    request: ProcessBankWebhookRequest,
  ): Promise<ProcessBankWebhookResponse> {
    const { tenantId, bankAccountId, provider, payload } = request;

    // 1. Validate bank account exists
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError('Bank account');
    }

    // 2. Get the banking provider and parse the webhook payload
    const bankingProvider = await this.getProvider(bankAccountId, provider);
    const webhookResult = await bankingProvider.handleWebhookPayload(payload);

    const { eventType, externalId, amount, paidAt } = webhookResult;

    // 3. Idempotency check — skip if already processed
    const existing = await this.webhookEventsRepository.findByExternalId(
      externalId,
      tenantId,
    );

    if (existing) {
      return {
        event: existing,
        matched: existing.matchedEntryId !== null,
        autoSettled: existing.autoSettled,
      };
    }

    // 4. Try to match with a FinanceEntry
    let matchedEntryId: string | undefined;

    if (eventType === 'PIX_RECEIVED') {
      // Search by txId stored in pixChargeId, or by amount + date proximity
      const result = await this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        status: 'PENDING',
      });

      const paidDate = new Date(paidAt);

      const matched = result.entries.find((entry) => {
        // Exact txId match via pixChargeId
        if (entry.pixChargeId && entry.pixChargeId === externalId) {
          return true;
        }

        // Amount + date proximity fallback (within 3 days)
        const dueDiff = Math.abs(entry.dueDate.getTime() - paidDate.getTime());
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        return entry.expectedAmount === amount && dueDiff <= threeDaysMs;
      });

      if (matched) {
        matchedEntryId = matched.id.toString();
      }
    } else if (eventType === 'BOLETO_PAID') {
      // Search by boletoBarcodeNumber (nossoNumero stored there)
      const result = await this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        status: 'PENDING',
      });

      const matched = result.entries.find(
        (entry) => entry.boletoBarcodeNumber === externalId,
      );

      if (matched) {
        matchedEntryId = matched.id.toString();
      }
    }

    // 5. Determine auto-settlement threshold
    // autoLowThreshold is not on the domain entity — query Prisma raw record via
    // a dedicated lookup in the factory (passed as null here by default;
    // the factory resolves it before calling execute).
    // For the use case we receive it pre-resolved via the bank account lookup.
    // Since BankAccount entity doesn't expose autoLowThreshold, we fall back to
    // querying it from Prisma in the factory. The use case accepts an optional
    // override via the request or reads zero (settle all) as a safe default.
    // We use amount === any to settle all when threshold is absent (null/0 = settle everything).
    const autoLowThreshold = await this.resolveAutoLowThreshold(bankAccountId);

    const shouldAutoSettle =
      matchedEntryId !== undefined &&
      (autoLowThreshold === null ||
        autoLowThreshold === 0 ||
        amount <= autoLowThreshold);

    // 6. Auto-settle if conditions are met
    if (matchedEntryId && shouldAutoSettle) {
      const entry = await this.financeEntriesRepository.findById(
        new UniqueEntityID(matchedEntryId),
        tenantId,
      );

      if (entry) {
        const newStatus = entry.type === 'RECEIVABLE' ? 'RECEIVED' : 'PAID';

        await this.financeEntriesRepository.update({
          id: entry.id,
          tenantId,
          status: newStatus,
          paymentDate: new Date(paidAt),
          actualAmount: amount,
        });
      }
    }

    // 7. Persist the webhook event. A race-safe fallback catches the DB-level
    // unique constraint (tenantId, externalId) for concurrent webhook deliveries
    // that passed the check in step 3 simultaneously.
    let event: BankWebhookEventRecord;
    try {
      event = await this.webhookEventsRepository.create({
        tenantId,
        bankAccountId,
        provider,
        eventType,
        externalId,
        amount,
        payload: webhookResult.rawPayload,
        matchedEntryId,
        autoSettled: shouldAutoSettle,
        processedAt: new Date(),
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        const existingAfterRace =
          await this.webhookEventsRepository.findByExternalId(
            externalId,
            tenantId,
          );
        if (existingAfterRace) {
          return {
            event: existingAfterRace,
            matched: existingAfterRace.matchedEntryId !== null,
            autoSettled: existingAfterRace.autoSettled,
          };
        }
      }
      throw err;
    }

    return {
      event,
      matched: matchedEntryId !== undefined,
      autoSettled: shouldAutoSettle,
    };
  }

  /**
   * Resolves the autoLowThreshold for a given bank account.
   * Subclasses or the factory can override this to query Prisma directly.
   * Default returns null (auto-settle everything).
   */
  protected async resolveAutoLowThreshold(
    _bankAccountId: string,
  ): Promise<number | null> {
    return null;
  }
}
