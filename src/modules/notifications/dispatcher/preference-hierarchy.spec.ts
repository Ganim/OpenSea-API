import { beforeEach, describe, expect, it, vi } from 'vitest';

// Logger + env stubs match the dispatcher-resolve spec — keeps unit runs
// decoupled from the real Prisma/env bootstrap.
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/prisma.js', () => ({ prisma: {} }));
vi.mock('@/@env', () => ({ env: { NOTIFICATIONS_STRICT_MANIFEST: false } }));

import { PreferenceResolver } from './preference-resolver';
import { NotificationChannel, NotificationPriority } from '../public/types';

type SettingsRepoMock = {
  getUserSettings: ReturnType<typeof vi.fn>;
  getModuleSetting: ReturnType<typeof vi.fn>;
  getCategoryPreference: ReturnType<typeof vi.fn>;
};

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

function buildResolver(mock: Partial<SettingsRepoMock> = {}) {
  const repo: SettingsRepoMock = {
    getUserSettings: vi.fn(async () => null),
    getModuleSetting: vi.fn(async () => null),
    getCategoryPreference: vi.fn(async () => null),
    ...mock,
  };
  const resolver = new PreferenceResolver(repo as never);
  return { resolver, repo };
}

describe('PreferenceResolver — hierarchy DND > master > module > category', () => {
  beforeEach(() => vi.clearAllMocks());

  it('falls back to defaults (IN_APP/EMAIL on, PUSH/SMS/WHATSAPP off) when no settings row exists', async () => {
    const { resolver } = buildResolver();
    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [
        NotificationChannel.IN_APP,
        NotificationChannel.EMAIL,
        NotificationChannel.PUSH,
        NotificationChannel.SMS,
        NotificationChannel.WHATSAPP,
      ],
      priority: NotificationPriority.NORMAL,
    });

    expect(result.allowedChannels).toEqual([
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ]);
    expect(result.suppressedChannels).toEqual([
      NotificationChannel.PUSH,
      NotificationChannel.SMS,
      NotificationChannel.WHATSAPP,
    ]);
  });

  it('DND suppresses every channel for non-URGENT priority when within window', async () => {
    const now = new Date();
    const start = `${String(now.getHours()).padStart(2, '0')}:00`;
    const end = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:59`;
    const { resolver } = buildResolver({
      getUserSettings: vi.fn(async () =>
        makeSettings({ doNotDisturb: true, dndStart: start, dndEnd: end }),
      ),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.NORMAL,
    });

    expect(result.allowedChannels).toHaveLength(0);
    expect(result.suppressedChannels).toEqual([
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ]);
    expect(result.reasons[NotificationChannel.IN_APP]).toBe('dnd');
  });

  it('URGENT priority bypasses DND', async () => {
    const now = new Date();
    const start = `${String(now.getHours()).padStart(2, '0')}:00`;
    const end = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:59`;
    const { resolver } = buildResolver({
      getUserSettings: vi.fn(async () =>
        makeSettings({ doNotDisturb: true, dndStart: start, dndEnd: end }),
      ),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.URGENT,
    });

    expect(result.allowedChannels).toEqual([
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ]);
  });

  it('master channel toggle OFF suppresses that channel and reports master_channel_off', async () => {
    const { resolver } = buildResolver({
      getUserSettings: vi.fn(async () => makeSettings({ masterEmail: false })),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.NORMAL,
    });

    expect(result.allowedChannels).toEqual([NotificationChannel.IN_APP]);
    expect(result.suppressedChannels).toEqual([NotificationChannel.EMAIL]);
    expect(result.reasons[NotificationChannel.EMAIL]).toBe(
      'master_channel_off',
    );
  });

  it('module OFF suppresses channels (module_off reason) when category is not mandatory', async () => {
    const { resolver } = buildResolver({
      getUserSettings: vi.fn(async () => makeSettings()),
      getModuleSetting: vi.fn(async () => ({ isEnabled: false })),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.NORMAL,
    });

    expect(result.allowedChannels).toHaveLength(0);
    expect(result.reasons[NotificationChannel.IN_APP]).toBe('module_off');
  });

  it('mandatory category bypasses module OFF', async () => {
    const { resolver } = buildResolver({
      getUserSettings: vi.fn(async () => makeSettings()),
      getModuleSetting: vi.fn(async () => ({ isEnabled: false })),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory({ mandatory: true }),
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
    });

    expect(result.allowedChannels).toEqual([NotificationChannel.IN_APP]);
  });

  it('category preference DISABLED frequency suppresses the channel', async () => {
    const { resolver } = buildResolver({
      getUserSettings: vi.fn(async () => makeSettings()),
      getCategoryPreference: vi.fn(async () => ({
        isEnabled: true,
        frequency: 'DISABLED',
      })),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
    });

    expect(result.allowedChannels).toHaveLength(0);
    expect(result.reasons[NotificationChannel.IN_APP]).toBe(
      'frequency_disabled',
    );
  });

  it('category preference isEnabled=false suppresses when category is not mandatory', async () => {
    const { resolver } = buildResolver({
      getUserSettings: vi.fn(async () => makeSettings()),
      getCategoryPreference: vi.fn(async () => ({
        isEnabled: false,
        frequency: 'INSTANT',
      })),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
    });

    expect(result.allowedChannels).toHaveLength(0);
    expect(result.reasons[NotificationChannel.IN_APP]).toBe('category_off');
  });

  it('DND reason takes precedence over master/module/category suppressions', async () => {
    const now = new Date();
    const start = `${String(now.getHours()).padStart(2, '0')}:00`;
    const end = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:59`;
    const { resolver, repo } = buildResolver({
      getUserSettings: vi.fn(async () =>
        makeSettings({
          doNotDisturb: true,
          dndStart: start,
          dndEnd: end,
          masterEmail: false,
        }),
      ),
      getModuleSetting: vi.fn(async () => ({ isEnabled: false })),
      getCategoryPreference: vi.fn(async () => ({
        isEnabled: false,
        frequency: 'DISABLED',
      })),
    });

    const result = await resolver.resolve({
      userId: 'user-1',
      tenantId: 'tenant-1',
      category: makeCategory(),
      channels: [NotificationChannel.EMAIL],
      priority: NotificationPriority.NORMAL,
    });

    // DND runs *inside* the channel loop — the resolver still fetches the
    // module setting once up-front (cheap, single query) but it MUST NOT
    // then consult the per-channel category preference, because DND short
    // -circuits before that branch.
    expect(result.reasons[NotificationChannel.EMAIL]).toBe('dnd');
    expect(repo.getCategoryPreference).not.toHaveBeenCalled();
  });

  it('overnight DND window (22:00 → 07:00) is active at 23:30', async () => {
    const originalNow = Date.now;
    // Freeze wall clock at 23:30.
    const frozen = new Date();
    frozen.setHours(23, 30, 0, 0);
    vi.spyOn(Date, 'now').mockReturnValue(frozen.getTime());
    // Also patch the Date constructor default so `new Date()` returns the
    // frozen instant in the resolver.
    const RealDate = Date;
    vi.stubGlobal(
      'Date',
      class extends RealDate {
        constructor(value?: string | number | Date) {
          if (value === undefined) {
            super(frozen.getTime());
          } else {
            super(value as never);
          }
        }
        static now() {
          return frozen.getTime();
        }
      },
    );

    try {
      const { resolver } = buildResolver({
        getUserSettings: vi.fn(async () =>
          makeSettings({
            doNotDisturb: true,
            dndStart: '22:00',
            dndEnd: '07:00',
          }),
        ),
      });

      const result = await resolver.resolve({
        userId: 'user-1',
        tenantId: 'tenant-1',
        category: makeCategory(),
        channels: [NotificationChannel.IN_APP],
        priority: NotificationPriority.NORMAL,
      });

      expect(result.reasons[NotificationChannel.IN_APP]).toBe('dnd');
    } finally {
      vi.unstubAllGlobals();
      Date.now = originalNow;
    }
  });
});
