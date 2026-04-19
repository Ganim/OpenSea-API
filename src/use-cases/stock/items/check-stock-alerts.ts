import { NotificationPriority } from '@/modules/notifications/public';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';
import type { ModuleNotifier } from '@/use-cases/shared/helpers/module-notifier';

export type StockAlertNotificationCategory =
  | 'stock.low_stock'
  | 'stock.out_of_stock';

export interface StockAlert {
  variantId: string;
  variantName: string;
  fullCode: string;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity?: number;
  deficit: number;
}

interface CheckStockAlertsUseCaseRequest {
  tenantId: string;
  /** Optional userId to receive notifications */
  notifyUserId?: string;
}

interface CheckStockAlertsUseCaseResponse {
  alerts: StockAlert[];
  notificationsCreated: number;
}

export class CheckStockAlertsUseCase {
  constructor(
    private variantsRepository: VariantsRepository,
    private itemsRepository: ItemsRepository,
    private notifier?: ModuleNotifier<StockAlertNotificationCategory>,
  ) {}

  async execute(
    request: CheckStockAlertsUseCaseRequest,
  ): Promise<CheckStockAlertsUseCaseResponse> {
    const { tenantId, notifyUserId } = request;

    const variants =
      await this.variantsRepository.findManyBelowReorderPoint(tenantId);

    const alerts: StockAlert[] = [];

    for (const variant of variants) {
      if (variant.reorderPoint === undefined || variant.reorderPoint === null) {
        continue;
      }

      const items = await this.itemsRepository.findManyByVariant(
        variant.id,
        tenantId,
      );

      const currentQuantity = items.reduce(
        (sum, item) => sum + item.currentQuantity,
        0,
      );

      if (currentQuantity < variant.reorderPoint) {
        alerts.push({
          variantId: variant.id.toString(),
          variantName: variant.name,
          fullCode: variant.fullCode,
          currentQuantity,
          reorderPoint: variant.reorderPoint,
          reorderQuantity: variant.reorderQuantity,
          deficit: variant.reorderPoint - currentQuantity,
        });
      }
    }

    let notificationsCreated = 0;

    if (this.notifier && notifyUserId && alerts.length > 0) {
      for (const alert of alerts) {
        const category: StockAlertNotificationCategory =
          alert.currentQuantity === 0
            ? 'stock.out_of_stock'
            : 'stock.low_stock';

        await this.notifier.dispatch({
          category,
          tenantId,
          recipientUserId: notifyUserId,
          title:
            alert.currentQuantity === 0
              ? 'Produto sem estoque'
              : 'Alerta de estoque baixo',
          body: `A variante "${alert.variantName}" (${alert.fullCode}) está abaixo do ponto de reposição. Quantidade atual: ${alert.currentQuantity}, mínimo: ${alert.reorderPoint}.`,
          priority: NotificationPriority.HIGH,
          entityType: 'VARIANT',
          entityId: alert.variantId,
          actionUrl: `/stock/variants/${alert.variantId}`,
          actionText: 'Ver variante',
        });

        notificationsCreated++;
      }
    }

    return { alerts, notificationsCreated };
  }
}
