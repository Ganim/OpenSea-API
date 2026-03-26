import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierTransactionDTO } from '@/mappers/sales/cashier/cashier-transaction-to-dto';
import { cashierTransactionToDTO } from '@/mappers/sales/cashier/cashier-transaction-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';
import type { CashierTransactionsRepository } from '@/repositories/sales/cashier-transactions-repository';

interface CreateCashierTransactionUseCaseRequest {
  tenantId: string;
  sessionId: string;
  type: 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT';
  amount: number;
  description?: string;
  paymentMethod?: string;
  referenceId?: string;
}

interface CreateCashierTransactionUseCaseResponse {
  transaction: CashierTransactionDTO;
}

export class CreateCashierTransactionUseCase {
  constructor(
    private cashierSessionsRepository: CashierSessionsRepository,
    private cashierTransactionsRepository: CashierTransactionsRepository,
  ) {}

  async execute(
    input: CreateCashierTransactionUseCaseRequest,
  ): Promise<CreateCashierTransactionUseCaseResponse> {
    if (input.amount <= 0) {
      throw new BadRequestError('Transaction amount must be positive.');
    }

    const session = await this.cashierSessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Cashier session not found.');
    }

    if (session.status !== 'OPEN') {
      throw new BadRequestError(
        'Transactions can only be added to open sessions.',
      );
    }

    const transaction = await this.cashierTransactionsRepository.create({
      sessionId: input.sessionId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      paymentMethod: input.paymentMethod,
      referenceId: input.referenceId,
    });

    return {
      transaction: cashierTransactionToDTO(transaction),
    };
  }
}
