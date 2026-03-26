import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { InMemoryCashierTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCashierTransactionsUseCase } from './list-cashier-transactions';

let sessionsRepository: InMemoryCashierSessionsRepository;
let transactionsRepository: InMemoryCashierTransactionsRepository;
let listTransactions: ListCashierTransactionsUseCase;

describe('ListCashierTransactionsUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    transactionsRepository = new InMemoryCashierTransactionsRepository();
    listTransactions = new ListCashierTransactionsUseCase(
      sessionsRepository,
      transactionsRepository,
    );
  });

  it('should list transactions for a session', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    await transactionsRepository.create({
      sessionId: session.id.toString(),
      type: 'SALE',
      amount: 50,
    });

    await transactionsRepository.create({
      sessionId: session.id.toString(),
      type: 'REFUND',
      amount: 10,
    });

    const result = await listTransactions.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should throw when session is not found', async () => {
    await expect(() =>
      listTransactions.execute({
        tenantId: 'tenant-1',
        sessionId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
