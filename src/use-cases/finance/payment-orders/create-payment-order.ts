import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankPaymentMethod } from '@prisma/generated/client.js';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  PaymentOrderRecord,
  PaymentOrdersRepository,
} from '@/repositories/finance/payment-orders-repository';

interface CreatePaymentOrderRequest {
  tenantId: string;
  entryId: string;
  bankAccountId: string;
  method: BankPaymentMethod;
  amount: number;
  recipientData: Record<string, unknown>;
  requestedById: string;
}

interface CreatePaymentOrderResponse {
  order: PaymentOrderRecord;
}

export class CreatePaymentOrderUseCase {
  constructor(
    private paymentOrdersRepository: PaymentOrdersRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
  ) {}

  async execute(
    request: CreatePaymentOrderRequest,
  ): Promise<CreatePaymentOrderResponse> {
    const {
      tenantId,
      entryId,
      bankAccountId,
      method,
      amount,
      recipientData,
      requestedById,
    } = request;

    // Validate entry exists and belongs to tenant
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    // Validate entry status is PENDING or OVERDUE
    if (entry.status !== 'PENDING' && entry.status !== 'OVERDUE') {
      throw new BadRequestError(
        'Payment order can only be created for entries with PENDING or OVERDUE status',
      );
    }

    // Validate bank account exists and belongs to tenant
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError('Bank account not found');
    }

    // Validate bank account is active
    if (!bankAccount.isActive) {
      throw new BadRequestError('Bank account is not active');
    }

    // Validate bank account has API integration enabled
    if (!bankAccount.apiEnabled) {
      throw new BadRequestError(
        'A conta bancária não possui integração bancária habilitada. Configure a API do banco antes de solicitar pagamentos.',
      );
    }

    // Create payment order with PENDING_APPROVAL status
    const order = await this.paymentOrdersRepository.create({
      tenantId,
      entryId,
      bankAccountId,
      method,
      amount,
      recipientData,
      requestedById,
    });

    return { order };
  }
}
