import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import {
  queueSyncProducts,
  getMarketplaceSyncProductsQueue,
  queueImportOrders,
  getMarketplaceImportOrdersQueue,
  queueSyncInventory,
  getMarketplaceSyncInventoryQueue,
} from './queues/marketplace';

// Intervals
const IMPORT_ORDERS_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SYNC_INVENTORY_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const SYNC_PRODUCTS_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let importOrdersIntervalId: ReturnType<typeof setInterval> | null = null;
let syncInventoryIntervalId: ReturnType<typeof setInterval> | null = null;
let syncProductsIntervalId: ReturnType<typeof setInterval> | null = null;

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Fetches all active marketplace connections across all tenants.
 */
async function getActiveConnections() {
  return prisma.marketplaceConnection.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      tenantId: true,
    },
  });
}

/**
 * Enqueues import-orders jobs for all active connections.
 */
async function scheduleImportOrders() {
  try {
    const connections = await getActiveConnections();
    const queue = getMarketplaceImportOrdersQueue();

    for (const conn of connections) {
      const jobId = `mkt-import-orders-${conn.id}`;
      const existing = await queue.getJob(jobId);

      if (existing) {
        const state = await existing.getState();
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          continue;
        }
        await existing.remove().catch((err) => {
          logger.warn({ err, jobId }, 'Failed to remove existing import-orders job');
        });
      }

      await queueImportOrders(
        {
          tenantId: conn.tenantId,
          connectionId: conn.id,
          since: new Date(Date.now() - IMPORT_ORDERS_INTERVAL_MS * 2).toISOString(),
        },
        { jobId },
      );
    }

    consecutiveErrors = 0;

    if (connections.length > 0) {
      logger.info(
        { count: connections.length },
        'Scheduled marketplace import-orders jobs',
      );
    }
  } catch (err) {
    consecutiveErrors++;
    logger.error(
      { err, consecutiveErrors, maxErrors: MAX_CONSECUTIVE_ERRORS },
      'Failed to schedule marketplace import-orders jobs',
    );
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(
        `Marketplace scheduler stopping after ${MAX_CONSECUTIVE_ERRORS} consecutive failures`,
      );
      stopMarketplaceScheduler();
    }
  }
}

/**
 * Enqueues sync-inventory jobs for all active connections.
 */
async function scheduleSyncInventory() {
  try {
    const connections = await getActiveConnections();
    const queue = getMarketplaceSyncInventoryQueue();

    for (const conn of connections) {
      const jobId = `mkt-sync-inventory-${conn.id}`;
      const existing = await queue.getJob(jobId);

      if (existing) {
        const state = await existing.getState();
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          continue;
        }
        await existing.remove().catch((err) => {
          logger.warn({ err, jobId }, 'Failed to remove existing sync-inventory job');
        });
      }

      await queueSyncInventory(
        {
          tenantId: conn.tenantId,
          connectionId: conn.id,
        },
        { jobId },
      );
    }

    if (connections.length > 0) {
      logger.info(
        { count: connections.length },
        'Scheduled marketplace sync-inventory jobs',
      );
    }
  } catch (err) {
    logger.error({ err }, 'Failed to schedule marketplace sync-inventory jobs');
  }
}

/**
 * Enqueues sync-products jobs for all active connections.
 */
async function scheduleSyncProducts() {
  try {
    const connections = await getActiveConnections();
    const queue = getMarketplaceSyncProductsQueue();

    for (const conn of connections) {
      const jobId = `mkt-sync-products-${conn.id}`;
      const existing = await queue.getJob(jobId);

      if (existing) {
        const state = await existing.getState();
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          continue;
        }
        await existing.remove().catch((err) => {
          logger.warn({ err, jobId }, 'Failed to remove existing sync-products job');
        });
      }

      await queueSyncProducts(
        {
          tenantId: conn.tenantId,
          connectionId: conn.id,
          productIds: [], // Full catalog sync — empty means all products
        },
        { jobId },
      );
    }

    if (connections.length > 0) {
      logger.info(
        { count: connections.length },
        'Scheduled marketplace sync-products jobs',
      );
    }
  } catch (err) {
    logger.error({ err }, 'Failed to schedule marketplace sync-products jobs');
  }
}

/**
 * Initializes the marketplace scheduler.
 * Runs an initial pass for each job type, then sets up recurring intervals.
 * Call this from the workers entrypoint (index.ts).
 */
export async function initMarketplaceScheduler(): Promise<void> {
  // Initial pass
  await scheduleImportOrders();
  await scheduleSyncInventory();
  await scheduleSyncProducts();

  // Set up recurring intervals
  importOrdersIntervalId = setInterval(
    scheduleImportOrders,
    IMPORT_ORDERS_INTERVAL_MS,
  );
  syncInventoryIntervalId = setInterval(
    scheduleSyncInventory,
    SYNC_INVENTORY_INTERVAL_MS,
  );
  syncProductsIntervalId = setInterval(
    scheduleSyncProducts,
    SYNC_PRODUCTS_INTERVAL_MS,
  );

  logger.info(
    {
      importOrdersInterval: IMPORT_ORDERS_INTERVAL_MS,
      syncInventoryInterval: SYNC_INVENTORY_INTERVAL_MS,
      syncProductsInterval: SYNC_PRODUCTS_INTERVAL_MS,
    },
    'Marketplace scheduler started successfully',
  );
}

/**
 * Stops all marketplace scheduled jobs.
 */
export function stopMarketplaceScheduler(): void {
  if (importOrdersIntervalId) {
    clearInterval(importOrdersIntervalId);
    importOrdersIntervalId = null;
  }
  if (syncInventoryIntervalId) {
    clearInterval(syncInventoryIntervalId);
    syncInventoryIntervalId = null;
  }
  if (syncProductsIntervalId) {
    clearInterval(syncProductsIntervalId);
    syncProductsIntervalId = null;
  }
  logger.info('Marketplace scheduler stopped');
}
