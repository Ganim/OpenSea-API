import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosSession } from '@/entities/sales/pos-session';
import { InMemoryPosCashMovementsRepository } from '@/repositories/sales/in-memory/in-memory-pos-cash-movements-repository';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { InMemoryPosTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ClosePosSessionUseCase } from './close-pos-session';

let posSessionsRepository: InMemoryPosSessionsRepository;
let posCashMovementsRepository: InMemoryPosCashMovementsRepository;
let posTransactionsRepository: InMemoryPosTransactionsRepository;
let closePosSession: ClosePosSessionUseCase;

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

function createOpenSession(
  overrides?: Partial<{ id: string; tenantId: string }>,
): PosSession {
  return PosSession.create({
    id: new UniqueEntityID(overrides?.id ?? 'session-1'),
    tenantId: new UniqueEntityID(overrides?.tenantId ?? TENANT_ID),
    terminalId: new UniqueEntityID('terminal-1'),
    operatorUserId: new UniqueEntityID(USER_ID),
    status: 'OPEN',
    openingBalance: 100,
  });
}

describe('ClosePosSessionUseCase', () => {
  beforeEach(() => {
    posSessionsRepository = new InMemoryPosSessionsRepository();
    posCashMovementsRepository = new InMemoryPosCashMovementsRepository();
    posTransactionsRepository = new InMemoryPosTransactionsRepository();
    closePosSession = new ClosePosSessionUseCase(
      posSessionsRepository,
      posCashMovementsRepository,
      posTransactionsRepository,
    );
  });

  it('should be able to close an open session', async () => {
    const openSession = createOpenSession();
    posSessionsRepository.items.push(openSession);

    const { session } = await closePosSession.execute({
      tenantId: TENANT_ID,
      sessionId: 'session-1',
      userId: USER_ID,
      closingBalance: 350,
    });

    expect(session.status).toBe('CLOSED');
    expect(session.closingBalance).toBe(350);
    expect(session.closedAt).toBeDefined();
  });

  it('should create a closing cash movement', async () => {
    const openSession = createOpenSession();
    posSessionsRepository.items.push(openSession);

    await closePosSession.execute({
      tenantId: TENANT_ID,
      sessionId: 'session-1',
      userId: USER_ID,
      closingBalance: 350,
    });

    const closingMovements = posCashMovementsRepository.items.filter(
      (m) => m.type === 'CLOSING',
    );
    expect(closingMovements).toHaveLength(1);
    expect(closingMovements[0].amount).toBe(350);
  });

  it('should accept closing breakdown and notes', async () => {
    const openSession = createOpenSession();
    posSessionsRepository.items.push(openSession);

    const { session } = await closePosSession.execute({
      tenantId: TENANT_ID,
      sessionId: 'session-1',
      userId: USER_ID,
      closingBalance: 500,
      closingBreakdown: { cash: 300, pix: 200 },
      notes: 'All good',
    });

    expect(session.closingBreakdown).toEqual({ cash: 300, pix: 200 });
    expect(session.notes).toBe('All good');
  });

  it('should not close a non-existent session', async () => {
    await expect(() =>
      closePosSession.execute({
        tenantId: TENANT_ID,
        sessionId: 'non-existent',
        userId: USER_ID,
        closingBalance: 100,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not close a session that is already closed', async () => {
    const closedSession = PosSession.create({
      id: new UniqueEntityID('session-closed'),
      tenantId: new UniqueEntityID(TENANT_ID),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID(USER_ID),
      status: 'CLOSED',
      openingBalance: 100,
    });
    posSessionsRepository.items.push(closedSession);

    await expect(() =>
      closePosSession.execute({
        tenantId: TENANT_ID,
        sessionId: 'session-closed',
        userId: USER_ID,
        closingBalance: 100,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
