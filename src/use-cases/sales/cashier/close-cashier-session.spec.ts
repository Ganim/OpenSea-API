import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { InMemoryCashierTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CloseCashierSessionUseCase } from './close-cashier-session';

let sessionsRepository: InMemoryCashierSessionsRepository;
let transactionsRepository: InMemoryCashierTransactionsRepository;
let closeSession: CloseCashierSessionUseCase;

describe('CloseCashierSessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    transactionsRepository = new InMemoryCashierTransactionsRepository();
    closeSession = new CloseCashierSessionUseCase(
      sessionsRepository,
      transactionsRepository,
    );
  });

  it('should close an open session and calculate expected balance', async () => {
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
      type: 'CASH_OUT',
      amount: 20,
    });

    const result = await closeSession.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
      closingBalance: 130,
    });

    expect(result.cashierSession.status).toBe('CLOSED');
    expect(result.cashierSession.expectedBalance).toBe(130); // 100 + 50 - 20
    expect(result.cashierSession.closingBalance).toBe(130);
    expect(result.cashierSession.difference).toBe(0);
  });

  it('should not close an already closed session', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    session.close(100, 100);
    await sessionsRepository.save(session);

    await expect(() =>
      closeSession.execute({
        tenantId: 'tenant-1',
        sessionId: session.id.toString(),
        closingBalance: 100,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when session is not found', async () => {
    await expect(() =>
      closeSession.execute({
        tenantId: 'tenant-1',
        sessionId: 'non-existent',
        closingBalance: 100,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
