import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { DefaultModuleNotifier } from '@/use-cases/shared/helpers/default-module-notifier';
import {
  CheckStockAlertsUseCase,
  type StockAlertNotificationCategory,
} from '../check-stock-alerts';

export function makeCheckStockAlertsUseCase() {
  return new CheckStockAlertsUseCase(
    new PrismaVariantsRepository(),
    new PrismaItemsRepository(),
    new DefaultModuleNotifier<StockAlertNotificationCategory>(),
  );
}
