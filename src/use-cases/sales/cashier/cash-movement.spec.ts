import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { InMemoryCashierTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CashMovementUseCase } from './cash-movement';

let sessionsRepository: InMemoryCashierSessionsRepository;
let transactionsRepository: InMemoryCashierTransactionsRepository;
let cashMovement: CashMovementUseCase;

describe('CashMovementUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    transactionsRepository = new InMemoryCashierTransactionsRepository();
    cashMovement = new CashMovementUseCase(
      sessionsRepository,
      transactionsRepository,
    );
  });

  it('should create a CASH_IN movement', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    const result = await cashMovement.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
      type: 'CASH_IN',
      amount: 50,
      description: 'Supply from safe',
    });

    expect(result.transaction.type).toBe('CASH_IN');
    expect(result.transaction.amount).toBe(50);
  });

  it('should create a CASH_OUT movement', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    const result = await cashMovement.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
      type: 'CASH_OUT',
      amount: 30,
      description: 'Withdrawal to safe',
    });

    expect(result.transaction.type).toBe('CASH_OUT');
  });

  it('should not allow movement on closed session', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    session.close(100, 100);
    await sessionsRepository.save(session);

    await expect(() =>
      cashMovement.execute({
        tenantId: 'tenant-1',
        sessionId: session.id.toString(),
        type: 'CASH_IN',
        amount: 50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when session is not found', async () => {
    await expect(() =>
      cashMovement.execute({
        tenantId: 'tenant-1',
        sessionId: 'non-existent',
        type: 'CASH_IN',
        amount: 50,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
