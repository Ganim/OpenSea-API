import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import {
  type FinanceEntryPaymentDTO,
  financeEntryPaymentToDTO,
} from '@/mappers/finance/finance-entry-payment/finance-entry-payment-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';
import type { CalendarSyncService } from '@/services/calendar/calendar-sync.service';
import { calculateNextDate } from '@/utils/finance/calculate-next-date';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface RegisterPaymentUseCaseRequest {
  entryId: string;
  tenantId: string;
  amount: number;
  paidAt: Date;
  bankAccountId?: string;
  method?: string;
  reference?: string;
  notes?: string;
  idempotencyKey?: string;
  createdBy?: string;
  interest?: number;
  penalty?: number;
}

interface RegisterPaymentUseCaseResponse {
  entry: FinanceEntryDTO;
  payment: FinanceEntryPaymentDTO;
  nextOccurrence?: FinanceEntryDTO;
  calculatedInterest?: number;
  calculatedPenalty?: number;
}

export class RegisterPaymentUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
    private calendarSyncService?: CalendarSyncService,
    private categoriesRepository?: FinanceCategoriesRepository,
    private transactionManager?: TransactionManager,
    private autoJournalFromPayment?: { execute(req: { tenantId: string; entryId: string; paymentId: string; bankAccountId: string; amount: number; paidAt: Date; createdBy?: string }): Promise<unknown> },
  ) {}

  async execute(
    request: RegisterPaymentUseCaseRequest,
  ): Promise<RegisterPaymentUseCaseResponse> {
    const { entryId, tenantId, amount, paidAt } = request;

    // Idempotency check: if a payment with this key already exists, return cached result
    if (request.idempotencyKey) {
      const existingPayment =
        await this.financeEntryPaymentsRepository.findByIdempotencyKey(
          request.idempotencyKey,
        );

      if (existingPayment) {
        const existingEntry = await this.financeEntriesRepository.findById(
          existingPayment.entryId,
          tenantId,
        );

        return {
          entry: financeEntryToDTO(existingEntry!),
          payment: financeEntryPaymentToDTO(existingPayment),
        };
      }
    }

    // Validation outside transaction
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );
    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    if (entry.status === 'CANCELLED') {
      throw new BadRequestError(
        'Cannot register payment for a cancelled entry',
      );
    }

    if (entry.status === 'PAID' || entry.status === 'RECEIVED') {
      throw new BadRequestError('Entry is already fully paid');
    }

    if (amount <= 0) {
      throw new BadRequestError('Payment amount must be positive');
    }

    // Auto-calculate interest and penalty for overdue entries
    let calculatedInterest: number | undefined;
    let calculatedPenalty: number | undefined;

    const isOverdue = paidAt > entry.dueDate;

    if (isOverdue && this.categoriesRepository) {
      const category = await this.categoriesRepository.findById(
        entry.categoryId,
        tenantId,
      );

      if (category) {
        const overdueDays = Math.floor(
          (paidAt.getTime() - entry.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (category.interestRate && overdueDays > 0) {
          calculatedInterest =
            Math.round(
              entry.expectedAmount *
                (category.interestRate / 30) *
                overdueDays *
                100,
            ) / 100;
        }

        if (category.penaltyRate) {
          calculatedPenalty =
            Math.round(entry.expectedAmount * category.penaltyRate * 100) / 100;
        }
      }
    }

    // Use caller-provided values if present, otherwise use calculated
    const finalInterest = request.interest ?? calculatedInterest;
    const finalPenalty = request.penalty ?? calculatedPenalty;

    // All DB writes inside transaction
    const executePayment = async (tx?: TransactionClient) => {
      // Update entry's interest and penalty if auto-calculated or overridden
      if (finalInterest !== undefined && finalInterest !== entry.interest) {
        await this.financeEntriesRepository.update(
          {
            id: new UniqueEntityID(entryId),
            tenantId,
            interest: finalInterest,
          },
          tx,
        );
      }

      if (finalPenalty !== undefined && finalPenalty !== entry.penalty) {
        await this.financeEntriesRepository.update(
          {
            id: new UniqueEntityID(entryId),
            tenantId,
            penalty: finalPenalty,
          },
          tx,
        );
      }

      // Re-fetch entry after interest/penalty updates to get correct totalDue
      const refreshedEntry =
        finalInterest !== undefined || finalPenalty !== undefined
          ? await this.financeEntriesRepository.findById(
              new UniqueEntityID(entryId),
              tenantId,
              tx,
            )
          : entry;

      const entryForPayment = refreshedEntry ?? entry;

      // TODO: CONCURRENCY — This validation is NOT safe under concurrent requests.
      // Two simultaneous payments can both read sumByEntryId=0 and both pass.
      // Proper fix requires: PostgreSQL SELECT ... FOR UPDATE or serializable
      // transaction isolation in the TransactionManager.
      // See: financial-precision.spec.ts concurrency tests for reproduction.
      const existingPaymentsSum =
        await this.financeEntryPaymentsRepository.sumByEntryId(
          new UniqueEntityID(entryId),
          tx,
        );

      const newTotal = existingPaymentsSum + amount;

      if (newTotal > entryForPayment.totalDue) {
        throw new BadRequestError('Valor do pagamento excede o saldo restante');
      }

      const payment = await this.financeEntryPaymentsRepository.create(
        {
          entryId,
          amount,
          paidAt,
          bankAccountId: request.bankAccountId,
          method: request.method,
          reference: request.reference,
          notes: request.notes,
          idempotencyKey: request.idempotencyKey,
          createdBy: request.createdBy,
        },
        tx,
      );

      const isFullyPaid = newTotal === entryForPayment.totalDue;

      if (isFullyPaid) {
        // Fully paid
        const fullyPaidStatus =
          entryForPayment.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
        await this.financeEntriesRepository.update(
          {
            id: new UniqueEntityID(entryId),
            tenantId,
            status: fullyPaidStatus,
            actualAmount: newTotal,
            paymentDate: paidAt,
          },
          tx,
        );
      } else {
        // Partially paid
        await this.financeEntriesRepository.update(
          {
            id: new UniqueEntityID(entryId),
            tenantId,
            status: 'PARTIALLY_PAID',
            actualAmount: newTotal,
          },
          tx,
        );
      }

      // Re-fetch updated entry
      const updatedEntry = await this.financeEntriesRepository.findById(
        new UniqueEntityID(entryId),
        tenantId,
        tx,
      );

      let nextOccurrence: FinanceEntryDTO | undefined;

      // RECURRING: auto-generate next occurrence when fully paid
      if (
        isFullyPaid &&
        entryForPayment.recurrenceType === 'RECURRING' &&
        entryForPayment.parentEntryId
      ) {
        nextOccurrence = await this.generateNextRecurringOccurrence(
          entryForPayment,
          tenantId,
          paidAt,
          tx,
        );
      }

      // INSTALLMENT: check if all siblings are paid, then mark master as PAID
      if (
        isFullyPaid &&
        entryForPayment.recurrenceType === 'INSTALLMENT' &&
        entryForPayment.parentEntryId
      ) {
        await this.checkAndMarkMasterAsPaid(entryForPayment, tenantId, tx);
      }

      return {
        updatedEntry: updatedEntry!,
        payment,
        nextOccurrence,
        isFullyPaid,
        entryForPayment,
        newTotal,
      };
    };

    const result = this.transactionManager
      ? await this.transactionManager.run((tx) => executePayment(tx))
      : await executePayment();

    // Calendar sync outside transaction (non-blocking)
    if (this.calendarSyncService) {
      const newStatus = result.isFullyPaid
        ? result.entryForPayment.type === 'PAYABLE'
          ? 'PAID'
          : 'RECEIVED'
        : 'PARTIALLY_PAID';

      try {
        await this.calendarSyncService.updateFinanceEventOnPayment({
          tenantId,
          entryId,
          entryType: result.entryForPayment.type,
          description: result.entryForPayment.description,
          status: newStatus,
        });
      } catch {
        // Calendar sync failure should not block the operation
      }
    }

    // Audit log outside transaction (non-blocking, fire-and-forget)
    queueAuditLog({
      userId: request.createdBy,
      action: 'FINANCE_PAYMENT_REGISTER',
      entity: 'FINANCE_ENTRY',
      entityId: entryId,
      module: 'FINANCE',
      description: `Registered payment of ${amount} for entry ${entry.code}`,
      oldData: {
        status: entry.status,
        actualAmount: entry.actualAmount,
      },
      newData: {
        status: result.updatedEntry.status,
        actualAmount: result.newTotal,
        paymentId: result.payment.id.toString(),
      },
      metadata: {
        code: entry.code,
        type: entry.type,
        paymentAmount: amount,
        paidAt: paidAt.toISOString(),
        method: request.method,
        isFullyPaid: result.isFullyPaid,
      },
    }).catch(() => {});

    // Generate journal entry for payment (non-blocking)
    if (this.autoJournalFromPayment && request.bankAccountId) {
      try {
        await this.autoJournalFromPayment.execute({
          tenantId: request.tenantId,
          entryId: request.entryId,
          paymentId: result.payment.id.toString(),
          bankAccountId: request.bankAccountId,
          amount: request.amount,
          paidAt: request.paidAt ?? new Date(),
          createdBy: request.createdBy,
        });
      } catch {
        // Don't fail payment if journal generation fails
      }
    }

    return {
      entry: financeEntryToDTO(result.updatedEntry),
      payment: financeEntryPaymentToDTO(result.payment),
      nextOccurrence: result.nextOccurrence,
      calculatedInterest: finalInterest,
      calculatedPenalty: finalPenalty,
    };
  }

  private async generateNextRecurringOccurrence(
    entry: FinanceEntry,
    tenantId: string,
    lastPaidAt: Date,
    tx?: TransactionClient,
  ): Promise<FinanceEntryDTO> {
    const nextInstallment = (entry.currentInstallment ?? 1) + 1;

    const nextDueDate = calculateNextDate(
      entry.dueDate,
      entry.recurrenceInterval ?? 1,
      entry.recurrenceUnit ?? 'MONTHLY',
      1,
    );

    const nextCode = await this.financeEntriesRepository.generateNextCode(
      tenantId,
      entry.type,
      tx,
    );

    const nextEntry = await this.financeEntriesRepository.create(
      {
        tenantId,
        type: entry.type,
        code: nextCode,
        description: `${entry.description.replace(/\s*\(\d+\)$/, '')} (${nextInstallment})`,
        notes: entry.notes,
        categoryId: entry.categoryId.toString(),
        costCenterId: entry.costCenterId?.toString(),
        bankAccountId: entry.bankAccountId?.toString(),
        supplierName: entry.supplierName,
        customerName: entry.customerName,
        supplierId: entry.supplierId,
        customerId: entry.customerId,
        salesOrderId: entry.salesOrderId,
        expectedAmount: entry.expectedAmount,
        issueDate: lastPaidAt,
        dueDate: nextDueDate,
        competenceDate: entry.competenceDate,
        recurrenceType: 'RECURRING',
        recurrenceInterval: entry.recurrenceInterval,
        recurrenceUnit: entry.recurrenceUnit,
        currentInstallment: nextInstallment,
        parentEntryId: entry.parentEntryId!.toString(),
        tags: [...entry.tags],
        createdBy: entry.createdBy,
      },
      tx,
    );

    return financeEntryToDTO(nextEntry);
  }

  private async checkAndMarkMasterAsPaid(
    entry: FinanceEntry,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const parentId = entry.parentEntryId!.toString();

    const { entries: siblings } = await this.financeEntriesRepository.findMany(
      {
        tenantId,
        parentEntryId: parentId,
        limit: 1000,
      },
      tx,
    );

    const allPaid = siblings.every(
      (s) => s.status === 'PAID' || s.status === 'RECEIVED',
    );

    if (allPaid) {
      const masterStatus = entry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
      await this.financeEntriesRepository.update(
        {
          id: new UniqueEntityID(parentId),
          tenantId,
          status: masterStatus,
        },
        tx,
      );
    }
  }
}
