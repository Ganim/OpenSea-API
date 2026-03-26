import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCashierSessionsUseCase } from './list-cashier-sessions';

let sessionsRepository: InMemoryCashierSessionsRepository;
let listSessions: ListCashierSessionsUseCase;

describe('ListCashierSessionsUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    listSessions = new ListCashierSessionsUseCase(sessionsRepository);
  });

  it('should list sessions with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      await sessionsRepository.create({
        tenantId: 'tenant-1',
        cashierId: `user-${i}`,
        openingBalance: 100,
      });
    }

    const result = await listSessions.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 10,
    });

    expect(result.cashierSessions).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by status', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    session.close(100, 100);
    await sessionsRepository.save(session);

    await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-2',
      openingBalance: 200,
    });

    const result = await listSessions.execute({
      tenantId: 'tenant-1',
      status: 'OPEN',
    });

    expect(result.cashierSessions).toHaveLength(1);
  });
});
