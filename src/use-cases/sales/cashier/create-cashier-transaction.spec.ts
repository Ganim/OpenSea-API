import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { InMemoryCashierTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCashierTransactionUseCase } from './create-cashier-transaction';

let sessionsRepository: InMemoryCashierSessionsRepository;
let transactionsRepository: InMemoryCashierTransactionsRepository;
let createTransaction: CreateCashierTransactionUseCase;

describe('CreateCashierTransactionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    transactionsRepository = new InMemoryCashierTransactionsRepository();
    createTransaction = new CreateCashierTransactionUseCase(
      sessionsRepository,
      transactionsRepository,
    );
  });

  it('should create a transaction on an open session', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    const result = await createTransaction.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
      type: 'SALE',
      amount: 50,
      paymentMethod: 'CASH',
    });

    expect(result.transaction).toBeDefined();
    expect(result.transaction.type).toBe('SALE');
    expect(result.transaction.amount).toBe(50);
  });

  it('should not create a transaction on a closed session', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    session.close(100, 100);
    await sessionsRepository.save(session);

    await expect(() =>
      createTransaction.execute({
        tenantId: 'tenant-1',
        sessionId: session.id.toString(),
        type: 'SALE',
        amount: 50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow zero or negative amount', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    await expect(() =>
      createTransaction.execute({
        tenantId: 'tenant-1',
        sessionId: session.id.toString(),
        type: 'SALE',
        amount: 0,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when session is not found', async () => {
    await expect(() =>
      createTransaction.execute({
        tenantId: 'tenant-1',
        sessionId: 'non-existent',
        type: 'SALE',
        amount: 50,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
