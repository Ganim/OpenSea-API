export {
  startSyncProductsWorker,
  queueSyncProducts,
  getMarketplaceSyncProductsQueue,
  type SyncProductsJobData,
} from './sync-products.job';

export {
  startImportOrdersWorker,
  queueImportOrders,
  getMarketplaceImportOrdersQueue,
  type ImportOrdersJobData,
} from './import-orders.job';

export {
  startSyncInventoryWorker,
  queueSyncInventory,
  getMarketplaceSyncInventoryQueue,
  type SyncInventoryJobData,
} from './sync-inventory.job';

/**
 * Starts all marketplace queue workers.
 */
export function startMarketplaceWorkers(): void {
  startSyncProductsWorker();
  startImportOrdersWorker();
  startSyncInventoryWorker();

  console.log('[Marketplace] All marketplace workers started');
}
