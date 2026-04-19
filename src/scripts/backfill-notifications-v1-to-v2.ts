/**
 * Backfill script: v1 notification preferences → v2.
 *
 * What this script does:
 * 1. For every user that has legacy `NotificationPreference` rows, ensure
 *    `UserNotificationSettings` exists (one per tenant the user belongs to).
 * 2. Emits a summary of how many legacy rows would map to v2 categories.
 *    Actual data migration of `alertType`→`categoryCode` is a product decision
 *    because v1 AlertType is stock-specific; we don't invent mappings.
 *
 * Safe to run multiple times (idempotent upserts, no deletes).
 *
 * Usage:
 *   npx tsx --env-file=.env src/scripts/backfill-notifications-v1-to-v2.ts
 *   npx tsx --env-file=.env src/scripts/backfill-notifications-v1-to-v2.ts --dry-run
 */

import { prisma } from '@/lib/prisma';

type Summary = {
  legacyPreferencesFound: number;
  usersWithLegacyPrefs: number;
  settingsCreated: number;
  settingsAlreadyPresent: number;
  unmappedAlertTypes: Record<string, number>;
};

async function run(dryRun: boolean): Promise<Summary> {
  const summary: Summary = {
    legacyPreferencesFound: 0,
    usersWithLegacyPrefs: 0,
    settingsCreated: 0,
    settingsAlreadyPresent: 0,
    unmappedAlertTypes: {},
  };

  const legacy = await prisma.notificationPreference.findMany({
    where: { deletedAt: null },
    select: { userId: true, alertType: true, channel: true, isEnabled: true },
  });
  summary.legacyPreferencesFound = legacy.length;

  for (const row of legacy) {
    summary.unmappedAlertTypes[row.alertType] =
      (summary.unmappedAlertTypes[row.alertType] ?? 0) + 1;
  }

  const userIds = Array.from(new Set(legacy.map((r) => r.userId)));
  summary.usersWithLegacyPrefs = userIds.length;

  for (const userId of userIds) {
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { userId, deletedAt: null },
      select: { tenantId: true },
    });

    for (const tu of tenantUsers) {
      const existing = await prisma.userNotificationSettings.findUnique({
        where: {
          userId_tenantId: { userId, tenantId: tu.tenantId },
        },
        select: { id: true },
      });

      if (existing) {
        summary.settingsAlreadyPresent++;
        continue;
      }

      if (!dryRun) {
        await prisma.userNotificationSettings.create({
          data: { userId, tenantId: tu.tenantId },
        });
      }
      summary.settingsCreated++;
    }
  }

  return summary;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(
    `[backfill-notifications-v1-to-v2] ${dryRun ? 'DRY-RUN' : 'LIVE'} mode`,
  );

  const summary = await run(dryRun);

  console.log('\n=== Summary ===');
  console.log(`Legacy v1 preferences found: ${summary.legacyPreferencesFound}`);
  console.log(`Users with legacy prefs:     ${summary.usersWithLegacyPrefs}`);
  console.log(`Settings rows created:       ${summary.settingsCreated}`);
  console.log(`Settings already present:    ${summary.settingsAlreadyPresent}`);
  console.log('\nUnmapped AlertType distribution:');
  for (const [alertType, count] of Object.entries(summary.unmappedAlertTypes)) {
    console.log(`  ${alertType.padEnd(24)} ${count}`);
  }
  console.log(
    '\nNote: alertType → categoryCode mapping is a product decision.',
  );
  console.log(
    'v1 preferences keep responding via deprecated endpoints until 2026-07-17.',
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
