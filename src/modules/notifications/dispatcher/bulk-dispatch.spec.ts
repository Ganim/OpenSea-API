import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const enqueueSpy = vi.fn(async () => ({ jobId: 'job-123' }));

vi.mock('../../../workers/queues/notification-bulk-dispatch.queue', () => ({
  enqueueBulkDispatch: enqueueSpy,
}));
vi.mock('../../../workers/queues/notification-bulk-dispatch.queue.js', () => ({
  enqueueBulkDispatch: enqueueSpy,
}));

import { NotificationDispatcher } from './notification-dispatcher';
import { InMemoryNotificationEventBus } from './notification-event-bus';
import { NotificationType } from '../public/types';

function buildDispatcher() {
  return new NotificationDispatcher({
    notificationRepo: {} as never,
    settingsRepo: {} as never,
    recipientResolver: {} as never,
    eventBus: new InMemoryNotificationEventBus(),
  });
}

describe('NotificationDispatcher.dispatchBulkAsync', () => {
  beforeEach(() => {
    enqueueSpy.mockClear();
  });

  it('enqueues a bulk job and returns jobId + recipientCount from userIds selector', async () => {
    const dispatcher = buildDispatcher();
    const result = await dispatcher.dispatchBulkAsync({
      type: NotificationType.INFORMATIONAL,
      tenantId: 'tenant-1',
      recipients: { userIds: ['u1', 'u2', 'u3'] },
      category: 'test.category',
      title: 't',
      body: 'b',
      idempotencyKey: 'bulk-123',
    });

    expect(result).toEqual({
      jobId: 'job-123',
      queued: true,
      recipientCount: 3,
    });
    expect(enqueueSpy).toHaveBeenCalledTimes(1);
  });

  it('returns recipientCount=0 when selector is a permission (can only be resolved at worker time)', async () => {
    const dispatcher = buildDispatcher();
    const result = await dispatcher.dispatchBulkAsync({
      type: NotificationType.INFORMATIONAL,
      tenantId: 'tenant-1',
      recipients: { permission: 'hr.employees.access' },
      category: 'test.category',
      title: 't',
      body: 'b',
      idempotencyKey: 'bulk-perm',
    });

    expect(result.recipientCount).toBe(0);
    expect(result.queued).toBe(true);
    expect(result.jobId).toBe('job-123');
  });

  it('returns recipientCount=0 when selector is a role', async () => {
    const dispatcher = buildDispatcher();
    const result = await dispatcher.dispatchBulkAsync({
      type: NotificationType.INFORMATIONAL,
      tenantId: 'tenant-1',
      recipients: { role: 'manager' },
      category: 'test.category',
      title: 't',
      body: 'b',
      idempotencyKey: 'bulk-role',
    });

    expect(result.recipientCount).toBe(0);
  });

  it('enqueues the full dispatch input verbatim so the worker can replay it', async () => {
    const dispatcher = buildDispatcher();
    const input = {
      type: NotificationType.LINK,
      tenantId: 'tenant-42',
      recipients: { userIds: ['u1'] },
      category: 'test.category',
      title: 'Título',
      body: 'Mensagem',
      actionUrl: '/go',
      idempotencyKey: 'bulk-link',
    } as const;

    await dispatcher.dispatchBulkAsync(input);

    expect(enqueueSpy).toHaveBeenCalledWith(input);
  });
});
