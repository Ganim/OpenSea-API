import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainEvent } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

const mocks = vi.hoisted(() => ({
  dispatchMock: vi.fn().mockResolvedValue({
    notificationIds: ['n-1'],
    recipientCount: 1,
    deduplicated: false,
    suppressedByPreference: 0,
  }),
}));

vi.mock('@/modules/notifications/public', () => ({
  notificationClient: { dispatch: mocks.dispatchMock },
  NotificationType: {
    INFORMATIONAL: 'INFORMATIONAL',
    LINK: 'LINK',
    ACTIONABLE: 'ACTIONABLE',
    APPROVAL: 'APPROVAL',
    FORM: 'FORM',
    PROGRESS: 'PROGRESS',
    SYSTEM_BANNER: 'SYSTEM_BANNER',
  },
}));

const dispatchMock = mocks.dispatchMock;

const { punchQrRotationCompletedDispatcherConsumer } = await import(
  './punch-qr-rotation-completed-dispatcher-consumer'
);

function makeQrRotationCompletedEvent(
  dataOverrides: Partial<{
    jobId: string;
    tenantId: string;
    invokedByUserId: string;
    processed: number;
    total: number;
    generatedPdfs: boolean;
    bulkPdfDownloadUrl: string | null;
  }> = {},
): DomainEvent {
  const data = {
    jobId: 'job-abc',
    tenantId: 'tenant-1',
    invokedByUserId: 'user-admin-1',
    processed: 25,
    total: 25,
    generatedPdfs: false,
    bulkPdfDownloadUrl: null,
    ...dataOverrides,
  };
  return {
    id: randomUUID(),
    type: PUNCH_EVENTS.QR_ROTATION_COMPLETED,
    version: 1,
    tenantId: data.tenantId,
    source: 'hr',
    sourceEntityType: 'qr_rotation_job',
    sourceEntityId: data.jobId,
    data,
    timestamp: new Date().toISOString(),
  };
}

describe('punchQrRotationCompletedDispatcherConsumer', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    dispatchMock.mockResolvedValue({
      notificationIds: ['n-1'],
      recipientCount: 1,
      deduplicated: false,
      suppressedByPreference: 0,
    });
  });

  describe('Consumer Properties', () => {
    it('has consumerId punch.qr-rotation-completed-dispatcher', () => {
      expect(punchQrRotationCompletedDispatcherConsumer.consumerId).toBe(
        'punch.qr-rotation-completed-dispatcher',
      );
    });

    it('belongs to punch module', () => {
      expect(punchQrRotationCompletedDispatcherConsumer.moduleId).toBe('punch');
    });

    it('subscribes ONLY to PUNCH_EVENTS.QR_ROTATION_COMPLETED', () => {
      expect(punchQrRotationCompletedDispatcherConsumer.subscribesTo).toEqual([
        PUNCH_EVENTS.QR_ROTATION_COMPLETED,
      ]);
    });
  });

  describe('handle QR_ROTATION_COMPLETED — small batch (processed <= 50)', () => {
    it('dispatches INFORMATIONAL punch.qr_rotation.completed to invokedByUserId only', async () => {
      const event = makeQrRotationCompletedEvent({ processed: 25, total: 25 });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);

      expect(dispatchMock).toHaveBeenCalledTimes(1);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.type).toBe('INFORMATIONAL');
      expect(payload.category).toBe('punch.qr_rotation.completed');
      expect(payload.tenantId).toBe('tenant-1');
      expect(payload.recipients).toEqual({ userIds: ['user-admin-1'] });
    });

    it('title mentions conclusion in Portuguese', async () => {
      const event = makeQrRotationCompletedEvent();
      await punchQrRotationCompletedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.title).toBe('Rotação de QR concluída');
    });

    it('body mentions processed / total', async () => {
      const event = makeQrRotationCompletedEvent({ processed: 25, total: 25 });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.body).toMatch(/25/);
    });

    it('idempotencyKey = punch:qr-rotation-completed:{jobId}', async () => {
      const event = makeQrRotationCompletedEvent({ jobId: 'job-xyz' });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.idempotencyKey).toBe(
        'punch:qr-rotation-completed:job-xyz',
      );
    });
  });

  describe('handle QR_ROTATION_COMPLETED — bulk batch (processed > 50)', () => {
    it('dispatches TWICE: once to invoker, once broadcast to admins (T-QR-01)', async () => {
      const event = makeQrRotationCompletedEvent({
        processed: 120,
        total: 120,
      });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);

      expect(dispatchMock).toHaveBeenCalledTimes(2);
      const payloads = dispatchMock.mock.calls.map((c) => c[0]);

      const toInvoker = payloads.find((p) => 'userIds' in p.recipients);
      const toAdmins = payloads.find((p) => 'permission' in p.recipients);
      expect(toInvoker).toBeDefined();
      expect(toAdmins).toBeDefined();
      expect(toAdmins!.recipients).toEqual({
        permission: 'hr.punch-devices.admin',
      });
    });

    it('does NOT broadcast when processed === 50 (boundary)', async () => {
      const event = makeQrRotationCompletedEvent({ processed: 50, total: 50 });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);
      expect(dispatchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('metadata + downloadUrl', () => {
    it('metadata carries jobId + processed + total + bulkPdfDownloadUrl', async () => {
      const event = makeQrRotationCompletedEvent({
        jobId: 'job-abc',
        processed: 25,
        total: 25,
        generatedPdfs: true,
        bulkPdfDownloadUrl: 'https://s3.example.com/bulk-abc.pdf',
      });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.metadata).toMatchObject({
        jobId: 'job-abc',
        processed: 25,
        total: 25,
        bulkPdfDownloadUrl: 'https://s3.example.com/bulk-abc.pdf',
      });
    });

    it('body references consolidated PDF when bulkPdfDownloadUrl is present', async () => {
      const event = makeQrRotationCompletedEvent({
        generatedPdfs: true,
        bulkPdfDownloadUrl: 'https://s3.example.com/bulk.pdf',
      });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.body.toLowerCase()).toContain('pdf');
    });

    it('body does NOT reference PDF when bulkPdfDownloadUrl is null', async () => {
      const event = makeQrRotationCompletedEvent({
        generatedPdfs: false,
        bulkPdfDownloadUrl: null,
      });
      await punchQrRotationCompletedDispatcherConsumer.handle(event);
      const payload = dispatchMock.mock.calls[0][0];
      expect(payload.body.toLowerCase()).not.toContain('pdf');
    });
  });

  describe('error handling', () => {
    it('re-throws dispatch errors so typedEventBus can retry', async () => {
      dispatchMock.mockRejectedValueOnce(new Error('dispatcher offline'));
      const event = makeQrRotationCompletedEvent();
      await expect(
        punchQrRotationCompletedDispatcherConsumer.handle(event),
      ).rejects.toThrow('dispatcher offline');
    });
  });
});
