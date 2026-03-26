import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierSessionDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import { cashierSessionToDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';
import type { CashierTransactionsRepository } from '@/repositories/sales/cashier-transactions-repository';

interface CloseCashierSessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
  closingBalance: number;
}

interface CloseCashierSessionUseCaseResponse {
  cashierSession: CashierSessionDTO;
}

export class CloseCashierSessionUseCase {
  constructor(
    private cashierSessionsRepository: CashierSessionsRepository,
    private cashierTransactionsRepository: CashierTransactionsRepository,
  ) {}

  async execute(
    input: CloseCashierSessionUseCaseRequest,
  ): Promise<CloseCashierSessionUseCaseResponse> {
    const session = await this.cashierSessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Cashier session not found.');
    }

    if (session.status !== 'OPEN') {
      throw new BadRequestError('Only open sessions can be closed.');
    }

    const transactions =
      await this.cashierTransactionsRepository.findBySessionId(session.id);

    let expectedBalance = session.openingBalance;
    for (const transaction of transactions) {
      if (transaction.type === 'SALE' || transaction.type === 'CASH_IN') {
        expectedBalance += transaction.amount;
      } else if (
        transaction.type === 'REFUND' ||
        transaction.type === 'CASH_OUT'
      ) {
        expectedBalance -= transaction.amount;
      }
    }

    session.close(input.closingBalance, expectedBalance);
    await this.cashierSessionsRepository.save(session);

    return {
      cashierSession: cashierSessionToDTO(session),
    };
  }
}
