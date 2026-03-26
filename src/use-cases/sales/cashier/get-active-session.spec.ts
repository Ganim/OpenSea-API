import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetActiveSessionUseCase } from './get-active-session';

let sessionsRepository: InMemoryCashierSessionsRepository;
let getActiveSession: GetActiveSessionUseCase;

describe('GetActiveSessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    getActiveSession = new GetActiveSessionUseCase(sessionsRepository);
  });

  it('should return the active session for a user', async () => {
    await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    const result = await getActiveSession.execute({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
    });

    expect(result.cashierSession).toBeDefined();
    expect(result.cashierSession!.status).toBe('OPEN');
  });

  it('should return null when no active session exists', async () => {
    const result = await getActiveSession.execute({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
    });

    expect(result.cashierSession).toBeNull();
  });
});
