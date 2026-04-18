/**
 * One-off migration: legacy `notification_preferences` (AlertType-based)
 * → `notification_preferences_v2` (NotificationCategory-based).
 *
 * Maps the legacy AlertType enum to v2 category codes. Unmapped
 * preferences are logged and skipped (they were Stock/Sales-only
 * alerts that never had a dispatch in the codebase).
 *
 * Idempotent — safe to run multiple times (uses upsert).
 *
 * Run: npx tsx --env-file=.env scripts/migrate-legacy-notification-preferences.ts
 */

import { prisma } from '../src/lib/prisma';

const ALERT_TYPE_TO_CATEGORY: Record<string, string> = {
  LOW_STOCK: 'stock.low_stock',
  OUT_OF_STOCK: 'stock.out_of_stock',
  EXPIRING_SOON: 'stock.expiring_30d',
  EXPIRED: 'stock.expired',
  PRICE_CHANGE: 'stock.price_changed_manual',
  REORDER_POINT: 'stock.reorder_point',
};

async function main() {
  const legacy = await prisma.notificationPreference.findMany({
    where: { deletedAt: null },
  });
  console.log(`Found ${legacy.length} legacy preferences to migrate.`);

  if (legacy.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const categories = await prisma.notificationCategory.findMany({
    where: {
      code: { in: Object.values(ALERT_TYPE_TO_CATEGORY) },
    },
    select: { id: true, code: true },
  });
  const catByCode = new Map(categories.map((c) => [c.code, c.id]));

  let migrated = 0;
  let skipped = 0;

  for (const pref of legacy) {
    const categoryCode = ALERT_TYPE_TO_CATEGORY[pref.alertType];
    if (!categoryCode) {
      skipped++;
      continue;
    }
    const categoryId = catByCode.get(categoryCode);
    if (!categoryId) {
      skipped++;
      continue;
    }

    // Resolve tenantId from the user's first tenantUser record
    const tu = await prisma.tenantUser.findFirst({
      where: { userId: pref.userId, deletedAt: null },
      select: { tenantId: true },
    });
    if (!tu) {
      skipped++;
      continue;
    }

    await prisma.notificationPreferenceV2.upsert({
      where: {
        userId_tenantId_categoryId_channel: {
          userId: pref.userId,
          tenantId: tu.tenantId,
          categoryId,
          channel: pref.channel,
        },
      },
      update: { isEnabled: pref.isEnabled },
      create: {
        userId: pref.userId,
        tenantId: tu.tenantId,
        categoryId,
        channel: pref.channel,
        isEnabled: pref.isEnabled,
        frequency: 'INSTANT',
      },
    });
    migrated++;
  }

  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (unmapped or no tenant): ${skipped}`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
