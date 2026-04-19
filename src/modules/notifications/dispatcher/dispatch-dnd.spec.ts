import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notificationDeliveryAttempt: { create: vi.fn(async () => ({})) },
    notificationCallbackJob: { create: vi.fn(async () => ({ id: 'job-1' })) },
  },
}));
vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    notificationDeliveryAttempt: { create: vi.fn(async () => ({})) },
    notificationCallbackJob: { create: vi.fn(async () => ({ id: 'job-1' })) },
  },
}));
vi.mock('@/@env', () => ({
  env: { NOTIFICATIONS_STRICT_MANIFEST: false },
}));

// Ensure the loader considers our category declared so strict path is bypassed.
vi.mock('../public/manifest-loader.js', () => ({
  isCategoryDeclared: () => true,
  listRegisteredManifests: () => [],
  registerManifestInMemory: vi.fn(),
}));

import { NotificationDispatcher } from './notification-dispatcher';
import { InMemoryNotificationEventBus } from './notification-event-bus';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../public/types';

function makeCategory(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cat-1',
    code: 'test.category',
    module: 'test',
    name: 'Test',
    description: null,
    icon: null,
    defaultKind: 'INFORMATIONAL',
    defaultPriority: 'NORMAL',
    defaultChannels: ['IN_APP', 'EMAIL'],
    digestSupported: true,
    mandatory: false,
    order: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

function makeSettings(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'st-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    doNotDisturb: false,
    dndStart: null,
    dndEnd: null,
    timezone: 'America/Sao_Paulo',
    digestSchedule: null,
    soundEnabled: true,
    masterInApp: true,
    masterEmail: true,
    masterPush: true,
    masterSms: true,
    masterWhatsapp: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

function buildDispatcher(opts: {
  dndActive?: boolean;
  dndStart?: string;
  dndEnd?: string;
  category?: ReturnType<typeof makeCategory>;
}) {
  const settingsRepo = {
    getCategoryByCode: vi.fn(async () => opts.category ?? makeCategory()),
    getUserSettings: vi.fn(async () =>
      opts.dndActive
        ? makeSettings({
            doNotDisturb: true,
            dndStart: opts.dndStart ?? '00:00',
            dndEnd: opts.dndEnd ?? '23:59',
          })
        : makeSettings(),
    ),
    getModuleSetting: vi.fn(async () => null),
    getCategoryPreference: vi.fn(async () => null),
  } as never;

  const created: Array<Record<string, unknown>> = [];
  const notificationRepo = {
    findByIdempotency: vi.fn(async () => null),
    findGroupedRecent: vi.fn(async () => null),
    findById: vi.fn(async () => null),
    create: vi.fn(async (data: Record<string, unknown>) => {
      const record = { id: `n-${created.length + 1}`, ...data };
      created.push(record);
      return record as never;
    }),
    incrementGrouped: vi.fn(),
    resolve: vi.fn(),
    markCancelled: vi.fn(),
    updateProgress: vi.fn(),
  } as never;

  const recipientResolver = {
    resolve: vi.fn(async () => ['user-1']),
  } as never;

  const dispatcher = new NotificationDispatcher({
    notificationRepo,
    settingsRepo,
    recipientResolver,
    eventBus: new InMemoryNotificationEventBus(),
  });

  return { dispatcher, created };
}

describe('NotificationDispatcher — DND suppression', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists nothing when DND suppresses all channels for NORMAL priority', async () => {
    const now = new Date();
    const start = `${String(now.getHours()).padStart(2, '0')}:00`;
    const end = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:59`;
    const { dispatcher, created } = buildDispatcher({
      dndActive: true,
      dndStart: start,
      dndEnd: end,
    });

    const result = await dispatcher.dispatch({
      type: NotificationType.INFORMATIONAL,
      tenantId: 'tenant-1',
      recipients: { userIds: ['user-1'] },
      category: 'test.category',
      title: 't',
      body: 'b',
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.NORMAL,
      idempotencyKey: `dnd-${Date.now()}`,
    });

    expect(created).toHaveLength(0);
    expect(result.notificationIds).toHaveLength(0);
    expect(result.suppressedByPreference).toBe(2);
    expect(result.recipientCount).toBe(1);
  });

  it('bypasses DND for URGENT priority and still delivers', async () => {
    const now = new Date();
    const start = `${String(now.getHours()).padStart(2, '0')}:00`;
    const end = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:59`;
    const { dispatcher, created } = buildDispatcher({
      dndActive: true,
      dndStart: start,
      dndEnd: end,
    });

    const result = await dispatcher.dispatch({
      type: NotificationType.SYSTEM_BANNER,
      tenantId: 'tenant-1',
      recipients: { userIds: ['user-1'] },
      category: 'test.category',
      title: 't',
      body: 'b',
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.URGENT,
      idempotencyKey: `urgent-${Date.now()}`,
    });

    expect(created).toHaveLength(1);
    expect(result.suppressedByPreference).toBe(0);
  });

  it('dispatches normally when DND window does not include current time', async () => {
    // 00:00 — 00:01 (current time outside this tiny window ~always)
    const { dispatcher, created } = buildDispatcher({
      dndActive: true,
      dndStart: '00:00',
      dndEnd: '00:01',
    });

    const result = await dispatcher.dispatch({
      type: NotificationType.INFORMATIONAL,
      tenantId: 'tenant-1',
      recipients: { userIds: ['user-1'] },
      category: 'test.category',
      title: 't',
      body: 'b',
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
      idempotencyKey: `no-dnd-${Date.now()}`,
    });

    // Guard: if current local time is between 00:00 and 00:01, skip the
    // delivered assertion.
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes >= 0 && minutes < 1) {
      expect(result.suppressedByPreference).toBe(1);
    } else {
      expect(created).toHaveLength(1);
      expect(result.notificationIds).toHaveLength(1);
    }
  });
});
