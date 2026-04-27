/**
 * NotifyUpdateFailedUseCase — unit spec (Plan 10-06 Task 6.4)
 *
 * 5 scenarios:
 *   1. Happy path: dispatches ACTIONABLE notification to each admin userId
 *   2. No admins found: returns { ok: true, dispatchedCount: 0 }
 *   3. Message truncated to 200 chars (T-10-06-03 LGPD)
 *   4. Device not found: uses deviceId as fallback label (graceful)
 *   5. Dispatch error for one recipient does not abort others (fail-open)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotifyUpdateFailedUseCase,
  type NotifyUpdateFailedPrisma,
  type NotifyUpdateFailedNotificationClient,
} from '../notify-update-failed';

function makePrismaMock(
  overrides?: Partial<NotifyUpdateFailedPrisma>,
): NotifyUpdateFailedPrisma {
  return {
    permissionGroup: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          { users: [{ userId: 'user-admin-1' }, { userId: 'user-admin-2' }] },
        ]),
    },
    punchDevice: {
      findUnique: vi.fn().mockResolvedValue({ name: 'Leitor Biométrico RH' }),
    },
    ...overrides,
  };
}

function makeNotificationClientMock(): NotifyUpdateFailedNotificationClient & {
  dispatch: ReturnType<typeof vi.fn>;
} {
  return {
    dispatch: vi.fn().mockResolvedValue({ notificationIds: ['notif-1'] }),
  };
}

describe('NotifyUpdateFailedUseCase', () => {
  let prismaMock: NotifyUpdateFailedPrisma;
  let notifMock: ReturnType<typeof makeNotificationClientMock>;

  beforeEach(() => {
    prismaMock = makePrismaMock();
    notifMock = makeNotificationClientMock();
  });

  // ── Test 1: Happy path ────────────────────────────────────────────────────
  it('dispatches ACTIONABLE notification to each admin userId', async () => {
    const useCase = new NotifyUpdateFailedUseCase(prismaMock, notifMock);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      deviceId: 'device-uuid',
      message: 'Download failed: network error',
    });

    expect(result.ok).toBe(true);
    expect(result.dispatchedCount).toBe(2);
    expect(result.recipientUserIds).toEqual(['user-admin-1', 'user-admin-2']);

    // Verify dispatch was called once per recipient
    expect(notifMock.dispatch).toHaveBeenCalledTimes(2);

    // Verify notification category and type
    const firstCall = notifMock.dispatch.mock.calls[0][0];
    expect(firstCall.category).toBe('punch.agent_update_failed');
    expect(firstCall.type).toBe('ACTIONABLE');
    expect(firstCall.tenantId).toBe('tenant-1');
    expect(firstCall.recipients.userIds).toEqual(['user-admin-1']);
    expect(firstCall.body).toContain('Leitor Biométrico RH');
    expect(firstCall.body).toContain('Download failed: network error');
    expect(firstCall.entity).toEqual({
      type: 'punch_device',
      id: 'device-uuid',
    });
  });

  // ── Test 2: No admins found ───────────────────────────────────────────────
  it('returns dispatchedCount=0 when no admins have hr.bio.admin permission', async () => {
    prismaMock = makePrismaMock({
      permissionGroup: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    });
    const useCase = new NotifyUpdateFailedUseCase(prismaMock, notifMock);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      deviceId: 'device-uuid',
      message: 'error',
    });

    expect(result.ok).toBe(true);
    expect(result.dispatchedCount).toBe(0);
    expect(result.recipientUserIds).toEqual([]);
    expect(notifMock.dispatch).not.toHaveBeenCalled();
  });

  // ── Test 3: Message truncated to 200 chars (T-10-06-03) ──────────────────
  it('truncates message to 200 chars (LGPD PII defence)', async () => {
    const useCase = new NotifyUpdateFailedUseCase(prismaMock, notifMock);
    const longMessage = 'A'.repeat(300);

    await useCase.execute({
      tenantId: 'tenant-1',
      deviceId: 'device-uuid',
      message: longMessage,
    });

    const callArg = notifMock.dispatch.mock.calls[0][0];
    // The body should contain the truncated message (200 chars max)
    expect(callArg.body).toContain('A'.repeat(200));
    expect(callArg.body).not.toContain('A'.repeat(201));
  });

  // ── Test 4: Device not found — uses deviceId as label (graceful) ──────────
  it('uses deviceId as fallback label when device is not found', async () => {
    prismaMock = makePrismaMock({
      punchDevice: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    });
    const useCase = new NotifyUpdateFailedUseCase(prismaMock, notifMock);

    await useCase.execute({
      tenantId: 'tenant-1',
      deviceId: 'device-uuid-fallback',
      message: 'some error',
    });

    const callArg = notifMock.dispatch.mock.calls[0][0];
    expect(callArg.body).toContain('device-uuid-fallback');
  });

  // ── Test 5: Dispatch failure for one recipient does not abort others ───────
  it('continues dispatching when one recipient dispatch fails (fail-open)', async () => {
    notifMock.dispatch
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce({ notificationIds: ['notif-ok'] });

    const useCase = new NotifyUpdateFailedUseCase(prismaMock, notifMock);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      deviceId: 'device-uuid',
      message: 'update error',
    });

    // First dispatch failed but second should succeed
    expect(result.dispatchedCount).toBe(1);
    expect(result.recipientUserIds).toEqual(['user-admin-2']);
    expect(notifMock.dispatch).toHaveBeenCalledTimes(2);
  });
});
