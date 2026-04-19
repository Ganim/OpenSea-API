import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

/**
 * Synthetic manifest used exclusively by the S3.8 smoke test
 * (`__audit__-smoke.e2e.spec.ts`). It declares a single APPROVAL category
 * so the smoke run can exercise the full pipeline:
 *   manifest → dispatcher → resolve → callback enqueue → audit log.
 *
 * NOT registered by `manifests/index.ts` — this category never exists in
 * production unless the smoke test registers it explicitly.
 */
export const auditSmokeManifest: ModuleNotificationManifest = {
  module: '__audit__',
  displayName: 'Audit Smoke',
  icon: 'TestTube',
  order: 999,
  categories: [
    {
      code: '__audit__.smoke_approval',
      name: 'Smoke approval',
      description:
        'Synthetic APPROVAL category used by the end-to-end smoke spec.',
      defaultType: NotificationType.APPROVAL,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP],
      digestSupported: false,
      mandatory: false,
    },
  ],
};
