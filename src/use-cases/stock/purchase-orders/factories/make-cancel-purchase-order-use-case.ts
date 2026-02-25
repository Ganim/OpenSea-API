import { PrismaPurchaseOrdersRepository } from '@/repositories/stock/prisma/prisma-purchase-orders-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { CancelPurchaseOrderUseCase } from '../cancel-purchase-order';

export function makeCancelPurchaseOrderUseCase() {
  const purchaseOrdersRepository = new PrismaPurchaseOrdersRepository();
  const calendarSyncService = makeCalendarSyncService();

  return new CancelPurchaseOrderUseCase(
    purchaseOrdersRepository,
    calendarSyncService,
  );
}
