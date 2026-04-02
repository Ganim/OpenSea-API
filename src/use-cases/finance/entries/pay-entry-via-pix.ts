import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';

interface PayEntryViaPixRequest {
  entryId: string;
  tenantId: string;
  bankAccountId?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
}

interface PayEntryViaPixResponse {
  entry: FinanceEntryDTO;
  payment: FinanceEntryPaymentDTO;
}

/**
 * Pay a PAYABLE entry via PIX.
 *
 * This is currently a placeholder — actual PIX sending via Efi's "pix send" API
 * requires special permissions (Pix Saque/Troco). For now, it registers a payment
 * with method='PIX' and marks the entry as PAID.
 */
export class PayEntryViaPixUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: PayEntryViaPixRequest,
  ): Promise<PayEntryViaPixResponse> {
    const { entryId, tenantId } = request;

    // Find entry
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    // Validate entry is PAYABLE
    if (entry.type !== 'PAYABLE') {
      throw new BadRequestError(
        'PIX payment is only available for payable entries',
      );
    }

    // Validate status is PENDING or OVERDUE
    if (entry.status !== 'PENDING' && entry.status !== 'OVERDUE') {
      throw new BadRequestError(
        'PIX payment can only be registered for entries with PENDING or OVERDUE status',
      );
    }

    // Validate entry has a PIX key
    if (!entry.pixKey) {
      throw new BadRequestError(
        'This entry does not have a PIX key associated. Add a PIX key before paying.',
      );
    }

    // Calculate payment amount = remaining balance
    const paymentAmount =
      entry.remainingBalance > 0 ? entry.remainingBalance : entry.totalDue;

    if (paymentAmount <= 0) {
      throw new BadRequestError(
        'Entry balance must be greater than zero to register payment',
      );
    }

    const paidAt = new Date();

    const executePayment = async (tx?: TransactionClient) => {
      // Create payment record
      const payment = await this.financeEntryPaymentsRepository.create(
        {
          entryId,
          amount: paymentAmount,
          paidAt,
          bankAccountId: request.bankAccountId,
          method: 'PIX',
          reference: request.reference,
          notes: request.notes || `Pagamento PIX para ${entry.pixKey}`,
          createdBy: request.createdBy,
        },
        tx,
      );

      // Update entry status to PAID
      const updatedEntry = await this.financeEntriesRepository.update(
        {
          id: new UniqueEntityID(entryId),
          tenantId,
          status: 'PAID',
          actualAmount: paymentAmount,
          paymentDate: paidAt,
        },
        tx,
      );

      return { updatedEntry: updatedEntry!, payment };
    };

    const result = this.transactionManager
      ? await this.transactionManager.run((tx) => executePayment(tx))
      : await executePayment();

    return {
      entry: financeEntryToDTO(result.updatedEntry),
      payment: financeEntryPaymentToDTO(result.payment),
    };
  }
}
