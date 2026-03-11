import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { CheckStockAlertsUseCase } from '../check-stock-alerts';

export function makeCheckStockAlertsUseCase() {
  const variantsRepository = new PrismaVariantsRepository();
  const itemsRepository = new PrismaItemsRepository();
  const notificationsRepository = new PrismaNotificationsRepository();

  return new CheckStockAlertsUseCase(
    variantsRepository,
    itemsRepository,
    notificationsRepository,
  );
}
