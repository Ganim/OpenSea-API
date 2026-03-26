import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { OpenCashierSessionUseCase } from './open-cashier-session';

let sessionsRepository: InMemoryCashierSessionsRepository;
let openSession: OpenCashierSessionUseCase;

describe('OpenCashierSessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    openSession = new OpenCashierSessionUseCase(sessionsRepository);
  });

  it('should open a new cashier session', async () => {
    const result = await openSession.execute({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    expect(result.cashierSession).toBeDefined();
    expect(result.cashierSession.status).toBe('OPEN');
    expect(result.cashierSession.openingBalance).toBe(100);
  });

  it('should not allow opening a session when one is already open', async () => {
    await openSession.execute({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    await expect(() =>
      openSession.execute({
        tenantId: 'tenant-1',
        cashierId: 'user-1',
        openingBalance: 200,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow different users to open sessions', async () => {
    await openSession.execute({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    const result = await openSession.execute({
      tenantId: 'tenant-1',
      cashierId: 'user-2',
      openingBalance: 200,
    });

    expect(result.cashierSession).toBeDefined();
  });

  it('should not allow negative opening balance', async () => {
    await expect(() =>
      openSession.execute({
        tenantId: 'tenant-1',
        cashierId: 'user-1',
        openingBalance: -50,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
