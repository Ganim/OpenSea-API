import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
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

interface RegisterPaymentUseCaseRequest {
  entryId: string;
  tenantId: string;
  amount: number;
  paidAt: Date;
  bankAccountId?: string;
  method?: string;
  reference?: string;
  notes?: string;
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
  ) {}

  async execute(
    request: RegisterPaymentUseCaseRequest,
  ): Promise<RegisterPaymentUseCaseResponse> {
    const { entryId, tenantId, amount, paidAt } = request;

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
            Math.round(entry.expectedAmount * (category.interestRate / 30) * overdueDays * 100) / 100;
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

    // Update entry's interest and penalty if auto-calculated or overridden
    if (finalInterest !== undefined && finalInterest !== entry.interest) {
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(entryId),
        tenantId,
        interest: finalInterest,
      });
    }

    if (finalPenalty !== undefined && finalPenalty !== entry.penalty) {
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(entryId),
        tenantId,
        penalty: finalPenalty,
      });
    }

    // Re-fetch entry after interest/penalty updates to get correct totalDue
    const refreshedEntry =
      finalInterest !== undefined || finalPenalty !== undefined
        ? await this.financeEntriesRepository.findById(
            new UniqueEntityID(entryId),
            tenantId,
          )
        : entry;

    const entryForPayment = refreshedEntry ?? entry;

    const existingPaymentsSum =
      await this.financeEntryPaymentsRepository.sumByEntryId(
        new UniqueEntityID(entryId),
      );

    const newTotal = existingPaymentsSum + amount;

    if (newTotal > entryForPayment.totalDue) {
      throw new BadRequestError('Payment amount exceeds remaining balance');
    }

    const payment = await this.financeEntryPaymentsRepository.create({
      entryId,
      amount,
      paidAt,
      bankAccountId: request.bankAccountId,
      method: request.method,
      reference: request.reference,
      notes: request.notes,
      createdBy: request.createdBy,
    });

    const isFullyPaid = newTotal === entryForPayment.totalDue;

    if (isFullyPaid) {
      // Fully paid
      const fullyPaidStatus = entryForPayment.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(entryId),
        tenantId,
        status: fullyPaidStatus,
        actualAmount: newTotal,
        paymentDate: paidAt,
      });
    } else {
      // Partially paid
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(entryId),
        tenantId,
        status: 'PARTIALLY_PAID',
        actualAmount: newTotal,
      });
    }

    // Update calendar event title to reflect payment status (non-blocking)
    if (this.calendarSyncService) {
      const newStatus = isFullyPaid
        ? (entryForPayment.type === 'PAYABLE' ? 'PAID' : 'RECEIVED')
        : 'PARTIALLY_PAID';

      try {
        await this.calendarSyncService.updateFinanceEventOnPayment({
          tenantId,
          entryId,
          entryType: entryForPayment.type as 'PAYABLE' | 'RECEIVABLE',
          description: entryForPayment.description,
          status: newStatus,
        });
      } catch {
        // Calendar sync failure should not block the operation
      }
    }

    // Re-fetch updated entry
    const updatedEntry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
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
      );
    }

    // INSTALLMENT: check if all siblings are paid, then mark master as PAID
    if (
      isFullyPaid &&
      entryForPayment.recurrenceType === 'INSTALLMENT' &&
      entryForPayment.parentEntryId
    ) {
      await this.checkAndMarkMasterAsPaid(entryForPayment, tenantId);
    }

    return {
      entry: financeEntryToDTO(updatedEntry!),
      payment: financeEntryPaymentToDTO(payment),
      nextOccurrence,
      calculatedInterest: finalInterest,
      calculatedPenalty: finalPenalty,
    };
  }

  private async generateNextRecurringOccurrence(
    entry: FinanceEntry,
    tenantId: string,
    lastPaidAt: Date,
  ): Promise<FinanceEntryDTO> {
    const nextInstallment = (entry.currentInstallment ?? 1) + 1;

    const nextDueDate = this.calculateNextDate(
      entry.dueDate,
      entry.recurrenceInterval ?? 1,
      entry.recurrenceUnit ?? 'MONTHLY',
      1,
    );

    const nextCode = await this.financeEntriesRepository.generateNextCode(
      tenantId,
      entry.type,
    );

    const nextEntry = await this.financeEntriesRepository.create({
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
    });

    return financeEntryToDTO(nextEntry);
  }

  private async checkAndMarkMasterAsPaid(
    entry: FinanceEntry,
    tenantId: string,
  ): Promise<void> {
    const parentId = entry.parentEntryId!.toString();

    const { entries: siblings } = await this.financeEntriesRepository.findMany({
      tenantId,
      parentEntryId: parentId,
      limit: 1000,
    });

    const allPaid = siblings.every(
      (s) => s.status === 'PAID' || s.status === 'RECEIVED',
    );

    if (allPaid) {
      const masterStatus = entry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(parentId),
        tenantId,
        status: masterStatus,
      });
    }
  }

  private calculateNextDate(
    baseDate: Date,
    interval: number,
    unit: string,
    multiplier: number,
  ): Date {
    const date = new Date(baseDate);
    const totalInterval = interval * multiplier;

    switch (unit) {
      case 'DAILY':
        date.setUTCDate(date.getUTCDate() + totalInterval);
        break;
      case 'WEEKLY':
        date.setUTCDate(date.getUTCDate() + totalInterval * 7);
        break;
      case 'MONTHLY':
        date.setUTCMonth(date.getUTCMonth() + totalInterval);
        break;
      case 'QUARTERLY':
        date.setUTCMonth(date.getUTCMonth() + totalInterval * 3);
        break;
      case 'ANNUAL':
        date.setUTCFullYear(date.getUTCFullYear() + totalInterval);
        break;
    }

    return date;
  }
}
