import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierSessionDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import { cashierSessionToDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import { cashierTransactionToDTO } from '@/mappers/sales/cashier/cashier-transaction-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';
import type { CashierTransactionsRepository } from '@/repositories/sales/cashier-transactions-repository';

interface GetCashierSessionByIdUseCaseRequest {
  tenantId: string;
  sessionId: string;
}

interface GetCashierSessionByIdUseCaseResponse {
  cashierSession: CashierSessionDTO;
}

export class GetCashierSessionByIdUseCase {
  constructor(
    private cashierSessionsRepository: CashierSessionsRepository,
    private cashierTransactionsRepository: CashierTransactionsRepository,
  ) {}

  async execute(
    input: GetCashierSessionByIdUseCaseRequest,
  ): Promise<GetCashierSessionByIdUseCaseResponse> {
    const session = await this.cashierSessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Cashier session not found.');
    }

    const transactions =
      await this.cashierTransactionsRepository.findBySessionId(session.id);
    const transactionDTOs = transactions.map(cashierTransactionToDTO);

    return {
      cashierSession: cashierSessionToDTO(session, transactionDTOs),
    };
  }
}
