import type { VariantsRepository } from '@/repositories/stock/variants-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

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
    private notificationsRepository?: NotificationsRepository,
  ) {}

  async execute(
    request: CheckStockAlertsUseCaseRequest,
  ): Promise<CheckStockAlertsUseCaseResponse> {
    const { tenantId, notifyUserId } = request;

    // Find all variants with a reorder point set
    const variants =
      await this.variantsRepository.findManyBelowReorderPoint(tenantId);

    const alerts: StockAlert[] = [];

    for (const variant of variants) {
      if (variant.reorderPoint === undefined || variant.reorderPoint === null) {
        continue;
      }

      // Sum current quantity across all items of this variant
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

    // Create notifications for each alert (if repository + userId available)
    let notificationsCreated = 0;

    if (this.notificationsRepository && notifyUserId && alerts.length > 0) {
      for (const alert of alerts) {
        // Check if notification already exists for this variant (avoid duplicates)
        const existing = await this.notificationsRepository.findByUserAndEntity(
          notifyUserId,
          'VARIANT',
          alert.variantId,
        );

        if (existing) {
          continue;
        }

        await this.notificationsRepository.create({
          userId: new UniqueEntityID(notifyUserId),
          title: 'Alerta de estoque baixo',
          message: `A variante "${alert.variantName}" (${alert.fullCode}) está abaixo do ponto de reposição. Quantidade atual: ${alert.currentQuantity}, mínimo: ${alert.reorderPoint}.`,
          type: 'WARNING',
          priority: 'HIGH',
          channel: 'IN_APP',
          entityType: 'VARIANT',
          entityId: alert.variantId,
          metadata: {
            currentQuantity: alert.currentQuantity,
            reorderPoint: alert.reorderPoint,
            deficit: alert.deficit,
            reorderQuantity: alert.reorderQuantity,
          },
        });

        notificationsCreated++;
      }
    }

    return { alerts, notificationsCreated };
  }
}
