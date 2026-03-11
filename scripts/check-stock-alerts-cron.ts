/**
 * Cron script: Check stock alerts
 *
 * Runs daily to:
 * 1. Find variants where current stock is below the reorder point
 * 2. Create in-app notifications for the tenant owner
 *
 * Usage:
 *   npx tsx scripts/check-stock-alerts-cron.ts
 *
 * Fly.io Machine schedule: daily at 09:00 UTC
 */

import { prisma } from '../src/lib/prisma';
import { PrismaVariantsRepository } from '../src/repositories/stock/prisma/prisma-variants-repository';
import { PrismaItemsRepository } from '../src/repositories/stock/prisma/prisma-items-repository';
import { PrismaNotificationsRepository } from '../src/repositories/notifications/prisma/prisma-notifications-repository';
import { CheckStockAlertsUseCase } from '../src/use-cases/stock/items/check-stock-alerts';

async function main() {
  console.log(`[check-stock-alerts] Starting at ${new Date().toISOString()}`);

  const variantsRepository = new PrismaVariantsRepository();
  const itemsRepository = new PrismaItemsRepository();
  const notificationsRepository = new PrismaNotificationsRepository();
  const useCase = new CheckStockAlertsUseCase(
    variantsRepository,
    itemsRepository,
    notificationsRepository,
  );

  // Fetch all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  console.log(
    `[check-stock-alerts] Found ${tenants.length} active tenants`,
  );

  let totalAlerts = 0;
  let totalNotifications = 0;

  for (const tenant of tenants) {
    try {
      // Find the tenant owner (first user with OWNER role) to attribute notifications
      const tenantOwner = await prisma.tenantUser.findFirst({
        where: { tenantId: tenant.id, role: 'OWNER' },
        select: { userId: true },
      });

      const result = await useCase.execute({
        tenantId: tenant.id,
        notifyUserId: tenantOwner?.userId,
      });

      totalAlerts += result.alerts.length;
      totalNotifications += result.notificationsCreated;

      if (result.alerts.length > 0) {
        console.log(
          `[check-stock-alerts] Tenant "${tenant.name}": ${result.alerts.length} alerts, ${result.notificationsCreated} notifications created`,
        );

        for (const alert of result.alerts) {
          console.log(
            `  - ${alert.variantName} (${alert.fullCode}): current=${alert.currentQuantity}, reorder=${alert.reorderPoint}, deficit=${alert.deficit}`,
          );
        }
      }
    } catch (error) {
      console.error(
        `[check-stock-alerts] Error for tenant "${tenant.name}":`,
        error,
      );
    }
  }

  console.log(`[check-stock-alerts] Summary:`);
  console.log(`  Total alerts: ${totalAlerts}`);
  console.log(`  Notifications created: ${totalNotifications}`);
  console.log(
    `[check-stock-alerts] Done at ${new Date().toISOString()}`,
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[check-stock-alerts] Fatal error:', err);
  process.exit(1);
});
