import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PurchaseOrderDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';
import type { CalendarSyncService } from '@/services/calendar/calendar-sync.service';
import type {
  RegisterItemEntryUseCase,
  RegisterItemEntryUseCaseOutput,
} from '@/use-cases/stock/items/register-item-entry';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface ReceivePurchaseOrderUseCaseRequest {
  tenantId: string;
  id: string;
  userId: string;
  /** Optional per-item notes or overrides for the entry */
  itemOverrides?: Array<{
    variantId: string;
    /** Override received quantity (partial receive). Defaults to PO line quantity */
    receivedQuantity?: number;
    notes?: string;
  }>;
}

interface ReceivePurchaseOrderUseCaseResponse {
  purchaseOrder: PurchaseOrderDTO;
  entries: RegisterItemEntryUseCaseOutput[];
}

export class ReceivePurchaseOrderUseCase {
  constructor(
    private purchaseOrdersRepository: PurchaseOrdersRepository,
    private registerItemEntryUseCase: RegisterItemEntryUseCase,
    private calendarSyncService?: CalendarSyncService,
  ) {}

  async execute(
    request: ReceivePurchaseOrderUseCaseRequest,
  ): Promise<ReceivePurchaseOrderUseCaseResponse> {
    const { tenantId, id, userId, itemOverrides } = request;

    const purchaseOrder = await this.purchaseOrdersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!purchaseOrder) {
      throw new ResourceNotFoundError('Purchase order not found');
    }

    // Receive transitions status from CONFIRMED → DELIVERED
    try {
      purchaseOrder.receive();
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    await this.purchaseOrdersRepository.save(purchaseOrder);

    // Build override map for quick lookup
    const overrideMap = new Map(
      (itemOverrides ?? []).map((o) => [o.variantId, o]),
    );

    // Create item entries for each PO line item
    const entries: RegisterItemEntryUseCaseOutput[] = [];
    const errors: Array<{ variantId: string; error: string }> = [];

    for (const poItem of purchaseOrder.items) {
      const variantId = poItem.variantId.toString();
      const override = overrideMap.get(variantId);
      const quantity = override?.receivedQuantity ?? poItem.quantity;

      if (quantity <= 0) {
        continue; // Skip zero-quantity items (not received)
      }

      try {
        const entry = await this.registerItemEntryUseCase.execute({
          tenantId,
          variantId,
          quantity,
          userId,
          movementType: 'PURCHASE',
          unitCost: poItem.unitCost,
          notes:
            override?.notes ??
            `Entrada via recebimento do pedido de compra ${purchaseOrder.orderNumber}`,
        });

        entries.push(entry);
      } catch (error) {
        errors.push({
          variantId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Remove calendar event (non-blocking)
    if (this.calendarSyncService) {
      try {
        await this.calendarSyncService.removeSystemEvent(
          tenantId,
          'STOCK_PO',
          id,
        );
      } catch {
        // Calendar sync failure should not block the operation
      }
    }

    // Audit log (fire-and-forget)
    queueAuditLog({
      userId,
      action: 'STOCK_PO_RECEIVED',
      entity: 'PURCHASE_ORDER',
      entityId: id,
      module: 'stock',
      description: `Pedido de compra ${purchaseOrder.orderNumber} recebido com ${entries.length} entradas`,
      newData: {
        orderId: id,
        tenantId,
        entriesCreated: entries.length,
        entriesFailed: errors.length,
        ...(errors.length > 0 && { errors }),
      },
    });

    if (errors.length > 0 && entries.length === 0) {
      throw new BadRequestError(
        `Falha ao criar todas as entradas de estoque: ${errors.map((e) => e.error).join('; ')}`,
      );
    }

    return {
      purchaseOrder: purchaseOrderToDTO(purchaseOrder),
      entries,
    };
  }
}
