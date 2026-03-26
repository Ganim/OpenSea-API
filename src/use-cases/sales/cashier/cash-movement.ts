import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierTransactionDTO } from '@/mappers/sales/cashier/cashier-transaction-to-dto';
import { cashierTransactionToDTO } from '@/mappers/sales/cashier/cashier-transaction-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';
import type { CashierTransactionsRepository } from '@/repositories/sales/cashier-transactions-repository';

interface CashMovementUseCaseRequest {
  tenantId: string;
  sessionId: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  description?: string;
}

interface CashMovementUseCaseResponse {
  transaction: CashierTransactionDTO;
}

export class CashMovementUseCase {
  constructor(
    private cashierSessionsRepository: CashierSessionsRepository,
    private cashierTransactionsRepository: CashierTransactionsRepository,
  ) {}

  async execute(
    input: CashMovementUseCaseRequest,
  ): Promise<CashMovementUseCaseResponse> {
    if (input.amount <= 0) {
      throw new BadRequestError('Movement amount must be positive.');
    }

    if (input.type !== 'CASH_IN' && input.type !== 'CASH_OUT') {
      throw new BadRequestError(
        'Movement type must be CASH_IN or CASH_OUT.',
      );
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
        'Cash movements can only be made on open sessions.',
      );
    }

    const transaction = await this.cashierTransactionsRepository.create({
      sessionId: input.sessionId,
      type: input.type,
      amount: input.amount,
      description: input.description,
    });

    return {
      transaction: cashierTransactionToDTO(transaction),
    };
  }
}
