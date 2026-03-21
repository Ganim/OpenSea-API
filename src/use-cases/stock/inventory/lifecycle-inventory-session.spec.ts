import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InventorySession } from '@/entities/stock/inventory-session';
import { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import { InMemoryInventorySessionItemsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-session-items-repository';
import { InMemoryInventorySessionsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-sessions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelInventorySessionUseCase } from './cancel-inventory-session';
import { CompleteInventorySessionUseCase } from './complete-inventory-session';
import { GetInventorySessionUseCase } from './get-inventory-session';
import { ListInventorySessionsUseCase } from './list-inventory-sessions';
import { PauseInventorySessionUseCase } from './pause-inventory-session';
import { ResumeInventorySessionUseCase } from './resume-inventory-session';

let sessionsRepository: InMemoryInventorySessionsRepository;
let sessionItemsRepository: InMemoryInventorySessionItemsRepository;

const TENANT_ID = 'tenant-1';

function createOpenSession() {
  const session = InventorySession.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    userId: new UniqueEntityID(),
    mode: 'BIN',
    binId: new UniqueEntityID(),
    status: 'OPEN',
    totalItems: 3,
  });
  sessionsRepository.sessions.push(session);
  return session;
}

describe('PauseInventorySessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
    sessionItemsRepository = new InMemoryInventorySessionItemsRepository();
  });

  it('should pause an open session', async () => {
    const sut = new PauseInventorySessionUseCase(sessionsRepository);
    const session = createOpenSession();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
    });

    expect(result.session.status).toBe('PAUSED');
  });

  it('should reject pausing a non-open session', async () => {
    const sut = new PauseInventorySessionUseCase(sessionsRepository);
    const session = createOpenSession();
    session.complete();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if session not found', async () => {
    const sut = new PauseInventorySessionUseCase(sessionsRepository);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});

describe('ResumeInventorySessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
  });

  it('should resume a paused session', async () => {
    const sut = new ResumeInventorySessionUseCase(sessionsRepository);
    const session = createOpenSession();
    session.pause();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
    });

    expect(result.session.status).toBe('OPEN');
  });

  it('should reject resuming an open session', async () => {
    const sut = new ResumeInventorySessionUseCase(sessionsRepository);
    const session = createOpenSession();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

describe('CompleteInventorySessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
    sessionItemsRepository = new InMemoryInventorySessionItemsRepository();
  });

  it('should complete an open session and mark pending items as missing', async () => {
    const sut = new CompleteInventorySessionUseCase(
      sessionsRepository,
      sessionItemsRepository,
    );
    const session = createOpenSession();

    // Add 2 pending items and 1 confirmed
    const pendingItem1 = InventorySessionItem.create({
      sessionId: session.id,
      itemId: new UniqueEntityID(),
      status: 'PENDING',
    });
    const pendingItem2 = InventorySessionItem.create({
      sessionId: session.id,
      itemId: new UniqueEntityID(),
      status: 'PENDING',
    });
    const confirmedItem = InventorySessionItem.create({
      sessionId: session.id,
      itemId: new UniqueEntityID(),
      status: 'CONFIRMED',
    });
    sessionItemsRepository.items.push(
      pendingItem1,
      pendingItem2,
      confirmedItem,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
    });

    expect(result.session.status).toBe('COMPLETED');
    expect(result.session.completedAt).toBeDefined();
    expect(result.session.divergentItems).toBe(2); // 2 pending -> missing

    // Check items were marked as missing
    const items = await sessionItemsRepository.findManyBySession(session.id);
    const missing = items.filter((i) => i.status === 'MISSING');
    expect(missing).toHaveLength(2);
  });

  it('should complete a paused session', async () => {
    const sut = new CompleteInventorySessionUseCase(
      sessionsRepository,
      sessionItemsRepository,
    );
    const session = createOpenSession();
    session.pause();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
    });

    expect(result.session.status).toBe('COMPLETED');
  });

  it('should reject completing a cancelled session', async () => {
    const sut = new CompleteInventorySessionUseCase(
      sessionsRepository,
      sessionItemsRepository,
    );
    const session = createOpenSession();
    session.cancel();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

describe('CancelInventorySessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
  });

  it('should cancel an open session', async () => {
    const sut = new CancelInventorySessionUseCase(sessionsRepository);
    const session = createOpenSession();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
    });

    expect(result.session.status).toBe('CANCELLED');
  });

  it('should cancel a paused session', async () => {
    const sut = new CancelInventorySessionUseCase(sessionsRepository);
    const session = createOpenSession();
    session.pause();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
    });

    expect(result.session.status).toBe('CANCELLED');
  });

  it('should reject cancelling a completed session', async () => {
    const sut = new CancelInventorySessionUseCase(sessionsRepository);
    const session = createOpenSession();
    session.complete();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

describe('ListInventorySessionsUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
  });

  it('should list sessions with pagination', async () => {
    const sut = new ListInventorySessionsUseCase(sessionsRepository);

    // Create 3 sessions
    createOpenSession();
    createOpenSession();
    createOpenSession();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
    });

    expect(result.sessions.data).toHaveLength(2);
    expect(result.sessions.total).toBe(3);
    expect(result.sessions.totalPages).toBe(2);
  });

  it('should filter by status', async () => {
    const sut = new ListInventorySessionsUseCase(sessionsRepository);

    const session1 = createOpenSession();
    createOpenSession();
    session1.pause();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
      status: 'PAUSED',
    });

    expect(result.sessions.data).toHaveLength(1);
    expect(result.sessions.data[0].status).toBe('PAUSED');
  });

  it('should filter by mode', async () => {
    const sut = new ListInventorySessionsUseCase(sessionsRepository);
    createOpenSession(); // BIN mode

    const zoneSession = InventorySession.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      userId: new UniqueEntityID(),
      mode: 'ZONE',
      zoneId: new UniqueEntityID(),
      status: 'OPEN',
    });
    sessionsRepository.sessions.push(zoneSession);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
      mode: 'ZONE',
    });

    expect(result.sessions.data).toHaveLength(1);
    expect(result.sessions.data[0].mode).toBe('ZONE');
  });
});

describe('GetInventorySessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
    sessionItemsRepository = new InMemoryInventorySessionItemsRepository();
  });

  it('should get session with items', async () => {
    const sut = new GetInventorySessionUseCase(
      sessionsRepository,
      sessionItemsRepository,
    );
    const session = createOpenSession();

    const item1 = InventorySessionItem.create({
      sessionId: session.id,
      itemId: new UniqueEntityID(),
      status: 'PENDING',
    });
    const item2 = InventorySessionItem.create({
      sessionId: session.id,
      itemId: new UniqueEntityID(),
      status: 'CONFIRMED',
    });
    sessionItemsRepository.items.push(item1, item2);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
    });

    expect(result.session.id.equals(session.id)).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  it('should reject if session not found', async () => {
    const sut = new GetInventorySessionUseCase(
      sessionsRepository,
      sessionItemsRepository,
    );

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
