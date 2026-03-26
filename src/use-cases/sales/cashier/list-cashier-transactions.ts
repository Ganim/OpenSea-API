import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierTransactionDTO } from '@/mappers/sales/cashier/cashier-transaction-to-dto';
import { cashierTransactionToDTO } from '@/mappers/sales/cashier/cashier-transaction-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';
import type { CashierTransactionsRepository } from '@/repositories/sales/cashier-transactions-repository';

interface ListCashierTransactionsUseCaseRequest {
  tenantId: string;
  sessionId: string;
  page?: number;
  perPage?: number;
}

interface ListCashierTransactionsUseCaseResponse {
  transactions: CashierTransactionDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListCashierTransactionsUseCase {
  constructor(
    private cashierSessionsRepository: CashierSessionsRepository,
    private cashierTransactionsRepository: CashierTransactionsRepository,
  ) {}

  async execute(
    input: ListCashierTransactionsUseCaseRequest,
  ): Promise<ListCashierTransactionsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const session = await this.cashierSessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Cashier session not found.');
    }

    const sessionId = new UniqueEntityID(input.sessionId);
    const [transactions, total] = await Promise.all([
      this.cashierTransactionsRepository.findMany(page, perPage, sessionId),
      this.cashierTransactionsRepository.countBySessionId(sessionId),
    ]);

    return {
      transactions: transactions.map(cashierTransactionToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
