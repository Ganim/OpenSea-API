import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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

    if (newTotal === entry.totalDue) {
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

    return {
      entry: financeEntryToDTO(updatedEntry!),
      payment: financeEntryPaymentToDTO(payment),
    };
  }
}
