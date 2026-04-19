import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stub env + logger BEFORE importing the dispatcher — its transitive imports
// (logger → @env) would otherwise fail env validation in unit context.
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/prisma.js', () => ({ prisma: {} }));
vi.mock('@/@env', () => ({
  env: { NOTIFICATIONS_STRICT_MANIFEST: false },
}));

import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { GoneError } from '@/@errors/use-cases/gone-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

import { NotificationDispatcher } from './notification-dispatcher';
import { InMemoryNotificationEventBus } from './notification-event-bus';
import type { NotificationRecord } from '../infrastructure/repositories/notification-prisma-repository';

type PartialRecord = Partial<NotificationRecord> & { id: string };

function makeRecord(overrides: PartialRecord): NotificationRecord {
  return {
    id: overrides.id,
    userId: 'user-1',
    tenantId: 'tenant-1',
    title: 't',
    message: 'm',
    type: 'INFO',
    priority: 'NORMAL',
    channel: 'IN_APP',
    actionUrl: null,
    actionText: null,
    entityType: null,
    entityId: null,
    metadata: null,
    isRead: false,
    isSent: false,
    scheduledFor: null,
    readAt: null,
    sentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    kind: 'APPROVAL',
    categoryId: null,
    channels: ['IN_APP'],
    fallbackUrl: null,
    actions: [
      { key: 'approve', label: 'Aprovar', style: 'primary' },
      { key: 'reject', label: 'Rejeitar', style: 'destructive' },
    ] as unknown as NotificationRecord['actions'],
    state: 'PENDING',
    resolvedAction: null,
    resolvedById: null,
    resolvedAt: null,
    resolvedPayload: null,
    callbackUrl: null,
    callbackStatus: 'NOT_APPLICABLE',
    callbackError: null,
    expiresAt: null,
    groupKey: null,
    digestBatchId: null,
    idempotencyKey: null,
    progress: null,
    progressTotal: null,
    templateCode: null,
    ...overrides,
  } as NotificationRecord;
}

function buildDispatcher(record: NotificationRecord | null) {
  const resolved: NotificationRecord[] = [];
  const notificationRepo = {
    findById: vi.fn(async () => record),
    resolve: vi.fn(
      async (params: {
        id: string;
        newState: 'RESOLVED' | 'DECLINED';
        action: string;
        resolvedById: string;
      }) => {
        const r = makeRecord({
          ...(record as PartialRecord),
          state: params.newState,
          resolvedAction: params.action,
          resolvedById: params.resolvedById,
          resolvedAt: new Date(),
        });
        resolved.push(r);
        return r;
      },
    ),
  } as never;

  const eventBus = new InMemoryNotificationEventBus();

  const dispatcher = new NotificationDispatcher({
    notificationRepo,
    eventBus,
  });

  return { dispatcher, resolved };
}

describe('NotificationDispatcher.resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws ResourceNotFoundError when notification is missing', async () => {
    const { dispatcher } = buildDispatcher(null);

    await expect(
      dispatcher.resolve({
        notificationId: '00000000-0000-0000-0000-000000000000',
        userId: 'user-1',
        actionKey: 'approve',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ForbiddenError when resolver is not the recipient', async () => {
    const record = makeRecord({ id: 'n1', userId: 'owner', state: 'PENDING' });
    const { dispatcher } = buildDispatcher(record);

    await expect(
      dispatcher.resolve({
        notificationId: 'n1',
        userId: 'attacker',
        actionKey: 'approve',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('resolves a pending notification', async () => {
    const record = makeRecord({ id: 'n1', userId: 'user-1', state: 'PENDING' });
    const { dispatcher, resolved } = buildDispatcher(record);

    const result = await dispatcher.resolve({
      notificationId: 'n1',
      userId: 'user-1',
      actionKey: 'approve',
    });

    expect(result.state).toBe('RESOLVED');
    expect(resolved).toHaveLength(1);
  });

  it('is idempotent when same actionKey is sent after resolution', async () => {
    const record = makeRecord({
      id: 'n1',
      userId: 'user-1',
      state: 'RESOLVED',
      resolvedAction: 'approve',
    });
    const { dispatcher, resolved } = buildDispatcher(record);

    const result = await dispatcher.resolve({
      notificationId: 'n1',
      userId: 'user-1',
      actionKey: 'approve',
    });

    expect(result.state).toBe('RESOLVED');
    // idempotent: must NOT re-persist
    expect(resolved).toHaveLength(0);
  });

  it('throws ConflictError when already resolved with a different action', async () => {
    const record = makeRecord({
      id: 'n1',
      userId: 'user-1',
      state: 'DECLINED',
      resolvedAction: 'reject',
    });
    const { dispatcher } = buildDispatcher(record);

    await expect(
      dispatcher.resolve({
        notificationId: 'n1',
        userId: 'user-1',
        actionKey: 'approve',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws GoneError when notification has expired', async () => {
    const record = makeRecord({
      id: 'n1',
      userId: 'user-1',
      state: 'PENDING',
      expiresAt: new Date(Date.now() - 60_000),
    });
    const { dispatcher } = buildDispatcher(record);

    await expect(
      dispatcher.resolve({
        notificationId: 'n1',
        userId: 'user-1',
        actionKey: 'approve',
      }),
    ).rejects.toBeInstanceOf(GoneError);
  });

  it('marks state DECLINED when action style is destructive', async () => {
    const record = makeRecord({ id: 'n1', userId: 'user-1', state: 'PENDING' });
    const { dispatcher, resolved } = buildDispatcher(record);

    const result = await dispatcher.resolve({
      notificationId: 'n1',
      userId: 'user-1',
      actionKey: 'reject',
    });

    expect(result.state).toBe('DECLINED');
    expect(resolved[0].resolvedAction).toBe('reject');
  });
});
