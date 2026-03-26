import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { InMemoryCashierTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCashierSessionByIdUseCase } from './get-cashier-session-by-id';

let sessionsRepository: InMemoryCashierSessionsRepository;
let transactionsRepository: InMemoryCashierTransactionsRepository;
let getSessionById: GetCashierSessionByIdUseCase;

describe('GetCashierSessionByIdUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    transactionsRepository = new InMemoryCashierTransactionsRepository();
    getSessionById = new GetCashierSessionByIdUseCase(
      sessionsRepository,
      transactionsRepository,
    );
  });

  it('should get a session with its transactions', async () => {
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

    const result = await getSessionById.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
    });

    expect(result.cashierSession.transactions).toHaveLength(1);
    expect(result.cashierSession.transactions![0].type).toBe('SALE');
  });

  it('should throw when session is not found', async () => {
    await expect(() =>
      getSessionById.execute({
        tenantId: 'tenant-1',
        sessionId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
