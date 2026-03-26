import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReconcileSessionUseCase } from './reconcile-session';

let sessionsRepository: InMemoryCashierSessionsRepository;
let reconcileSession: ReconcileSessionUseCase;

describe('ReconcileSessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryCashierSessionsRepository();
    reconcileSession = new ReconcileSessionUseCase(sessionsRepository);
  });

  it('should reconcile a closed session', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    session.close(100, 100);
    await sessionsRepository.save(session);

    const result = await reconcileSession.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
    });

    expect(result.cashierSession.status).toBe('RECONCILED');
  });

  it('should not reconcile an open session', async () => {
    const session = await sessionsRepository.create({
      tenantId: 'tenant-1',
      cashierId: 'user-1',
      openingBalance: 100,
    });

    await expect(() =>
      reconcileSession.execute({
        tenantId: 'tenant-1',
        sessionId: session.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when session is not found', async () => {
    await expect(() =>
      reconcileSession.execute({
        tenantId: 'tenant-1',
        sessionId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
