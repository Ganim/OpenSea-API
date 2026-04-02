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
export async function startMarketplaceWorkers(): Promise<void> {
  const { startSyncProductsWorker: startProducts } = await import(
    './sync-products.job'
  );
  const { startImportOrdersWorker: startOrders } = await import(
    './import-orders.job'
  );
  const { startSyncInventoryWorker: startInventory } = await import(
    './sync-inventory.job'
  );

  startProducts();
  startOrders();
  startInventory();

  console.log('[Marketplace] All marketplace workers started');
}
