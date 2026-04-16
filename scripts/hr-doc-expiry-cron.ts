/**
 * Cron script: HR document expiry notifications
 *
 * Iterates over every active tenant and runs the
 * {@link NotifyDocExpiryUseCase}, scanning HR-related documents (medical exams
 * and training enrollments) that expire within the configured lookahead window
 * and dispatching one in-app notification per item.
 *
 * Idempotent: notifications are de-duplicated at the
 * {@link CreateNotificationUseCase} layer on (userId + entityType + entityId).
 *
 * Equivalent in-process scheduler: `src/workers/hr-doc-expiry-scheduler.ts`
 * Cron expression target:           `0 8 * * *` (every day, 08:00 UTC)
 *
 * Usage:
 *   npm run cron:hr-doc-expiry
 *   # or directly:
 *   npx tsx --env-file=.env scripts/hr-doc-expiry-cron.ts
 *
 * Exit codes:
 *   0 — all tenants processed successfully (or no tenants found)
 *   1 — at least one tenant failed
 */

import { prisma } from '../src/lib/prisma';
import { makeNotifyDocExpiryUseCase } from '../src/use-cases/hr/notifications/factories/make-notify-doc-expiry-use-case';

const LOG_PREFIX = '[hr-doc-expiry-cron]';

async function main() {
  const startedAt = Date.now();
  console.log(`${LOG_PREFIX} Starting at ${new Date().toISOString()}`);

  const useCase = makeNotifyDocExpiryUseCase();

  const activeTenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true, name: true },
  });

  console.log(`${LOG_PREFIX} Found ${activeTenants.length} active tenants`);

  let totalNotificationsCreated = 0;
  let totalScannedMedicalExams = 0;
  let totalScannedTrainings = 0;
  let failedTenants = 0;

  for (const tenant of activeTenants) {
    try {
      const result = await useCase.execute({ tenantId: tenant.id });

      totalNotificationsCreated += result.notificationsCreated;
      totalScannedMedicalExams += result.scannedMedicalExams;
      totalScannedTrainings += result.scannedTrainings;

      if (result.notificationsCreated > 0) {
        console.log(
          `${LOG_PREFIX} Tenant "${tenant.name}": ${result.notificationsCreated} notification(s) — exams=${result.scannedMedicalExams} trainings=${result.scannedTrainings}`,
        );
      }
    } catch (error) {
      failedTenants++;
      console.error(
        `${LOG_PREFIX} Error for tenant "${tenant.name}" (${tenant.id}):`,
        error,
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  console.log(`${LOG_PREFIX} Summary:`);
  console.log(`  Tenants processed:   ${activeTenants.length}`);
  console.log(`  Failed tenants:      ${failedTenants}`);
  console.log(`  Notifications:       ${totalNotificationsCreated}`);
  console.log(`  Scanned medical exams: ${totalScannedMedicalExams}`);
  console.log(`  Scanned trainings:     ${totalScannedTrainings}`);
  console.log(`  Duration: ${durationMs}ms`);
  console.log(`${LOG_PREFIX} Done at ${new Date().toISOString()}`);

  await prisma.$disconnect();

  process.exit(failedTenants > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(`${LOG_PREFIX} Fatal error:`, err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
