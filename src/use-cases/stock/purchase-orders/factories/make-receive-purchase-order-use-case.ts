import { PrismaPurchaseOrdersRepository } from '@/repositories/stock/prisma/prisma-purchase-orders-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { makeRegisterItemEntryUseCase } from '@/use-cases/stock/items/factories/make-register-item-entry-use-case';
import { ReceivePurchaseOrderUseCase } from '../receive-purchase-order';

export function makeReceivePurchaseOrderUseCase() {
  const purchaseOrdersRepository = new PrismaPurchaseOrdersRepository();
  const registerItemEntryUseCase = makeRegisterItemEntryUseCase();
  const calendarSyncService = makeCalendarSyncService();

  return new ReceivePurchaseOrderUseCase(
    purchaseOrdersRepository,
    registerItemEntryUseCase,
    calendarSyncService,
  );
}
