/**
 * Cron script: Check location consistency
 *
 * Runs periodically to:
 * 1. Detect and fix orphaned items (binId pointing to soft-deleted bins)
 * 2. Report empty soft-deleted bins (informational)
 * 3. Detect and fix occupancy mismatches (currentOccupancy != actual item count)
 *
 * Usage:
 *   npx tsx scripts/location-consistency-cron.ts
 *
 * Fly.io Machine schedule: weekly (recommended)
 */

import { prisma } from '../src/lib/prisma';
import { PrismaBinsRepository } from '../src/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemsRepository } from '../src/repositories/stock/prisma/prisma-items-repository';
import { CheckLocationConsistencyUseCase } from '../src/use-cases/stock/admin/check-location-consistency';

async function main() {
  console.log(`[location-consistency] Starting at ${new Date().toISOString()}`);

  const itemsRepository = new PrismaItemsRepository();
  const binsRepository = new PrismaBinsRepository();
  const useCase = new CheckLocationConsistencyUseCase(
    itemsRepository,
    binsRepository,
  );

  // Fetch all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  console.log(`[location-consistency] Found ${tenants.length} active tenants`);

  let totalOrphanedItems = 0;
  let totalEmptyDeletedBins = 0;
  let totalOccupancyMismatches = 0;

  for (const tenant of tenants) {
    try {
      const result = await useCase.execute({
        tenantId: tenant.id,
      });

      totalOrphanedItems += result.orphanedItems;
      totalEmptyDeletedBins += result.emptyDeletedBins;
      totalOccupancyMismatches += result.occupancyMismatches;

      if (result.orphanedItems > 0 || result.occupancyMismatches > 0) {
        console.log(
          `[location-consistency] Tenant "${tenant.name}": ${result.orphanedItems} orphaned items fixed, ${result.emptyDeletedBins} empty deleted bins, ${result.occupancyMismatches} occupancy mismatches fixed`,
        );
      }
    } catch (error) {
      console.error(
        `[location-consistency] Error for tenant "${tenant.name}":`,
        error,
      );
    }
  }

  console.log(`[location-consistency] Summary:`);
  console.log(`  Orphaned items fixed: ${totalOrphanedItems}`);
  console.log(`  Empty deleted bins: ${totalEmptyDeletedBins}`);
  console.log(`  Occupancy mismatches fixed: ${totalOccupancyMismatches}`);
  console.log(`[location-consistency] Done at ${new Date().toISOString()}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[location-consistency] Fatal error:', err);
  process.exit(1);
});
