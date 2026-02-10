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
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';

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
}

interface RegisterPaymentUseCaseResponse {
  entry: FinanceEntryDTO;
  payment: FinanceEntryPaymentDTO;
  nextOccurrence?: FinanceEntryDTO;
}

export class RegisterPaymentUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
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
      throw new BadRequestError('Cannot register payment for a cancelled entry');
    }

    if (entry.status === 'PAID' || entry.status === 'RECEIVED') {
      throw new BadRequestError('Entry is already fully paid');
    }

    if (amount <= 0) {
      throw new BadRequestError('Payment amount must be positive');
    }

    const existingPaymentsSum = await this.financeEntryPaymentsRepository.sumByEntryId(
      new UniqueEntityID(entryId),
    );

    const newTotal = existingPaymentsSum + amount;

    if (newTotal > entry.totalDue) {
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

    const isFullyPaid = newTotal === entry.totalDue;

    if (isFullyPaid) {
      // Fully paid
      const fullyPaidStatus = entry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(entryId),
        status: fullyPaidStatus,
        actualAmount: newTotal,
        paymentDate: paidAt,
      });
    } else {
      // Partially paid
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(entryId),
        status: 'PARTIALLY_PAID',
        actualAmount: newTotal,
      });
    }

    // Re-fetch updated entry
    const updatedEntry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    let nextOccurrence: FinanceEntryDTO | undefined;

    // RECURRING: auto-generate next occurrence when fully paid
    if (isFullyPaid && entry.recurrenceType === 'RECURRING' && entry.parentEntryId) {
      nextOccurrence = await this.generateNextRecurringOccurrence(entry, tenantId, paidAt);
    }

    // INSTALLMENT: check if all siblings are paid, then mark master as PAID
    if (isFullyPaid && entry.recurrenceType === 'INSTALLMENT' && entry.parentEntryId) {
      await this.checkAndMarkMasterAsPaid(entry, tenantId);
    }

    return {
      entry: financeEntryToDTO(updatedEntry!),
      payment: financeEntryPaymentToDTO(payment),
      nextOccurrence,
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

    const nextCode = await this.financeEntriesRepository.generateNextCode(tenantId, entry.type);

    const nextEntry = await this.financeEntriesRepository.create({
      tenantId,
      type: entry.type,
      code: nextCode,
      description: `${entry.description.replace(/\s*\(\d+\)$/, '')} (${nextInstallment})`,
      notes: entry.notes,
      categoryId: entry.categoryId.toString(),
      costCenterId: entry.costCenterId.toString(),
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

    const allPaid = siblings.every((s) =>
      s.status === 'PAID' || s.status === 'RECEIVED',
    );

    if (allPaid) {
      const masterStatus = entry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';
      await this.financeEntriesRepository.update({
        id: new UniqueEntityID(parentId),
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
