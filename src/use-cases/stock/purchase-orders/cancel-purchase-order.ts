import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PurchaseOrderDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';
import type { CalendarSyncService } from '@/services/calendar/calendar-sync.service';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface CancelPurchaseOrderUseCaseRequest {
  tenantId: string;
  id: string;
  userId?: string;
}

interface CancelPurchaseOrderUseCaseResponse {
  purchaseOrder: PurchaseOrderDTO;
}

export class CancelPurchaseOrderUseCase {
  constructor(
    private purchaseOrdersRepository: PurchaseOrdersRepository,
    private calendarSyncService?: CalendarSyncService,
  ) {}

  async execute(
    request: CancelPurchaseOrderUseCaseRequest,
  ): Promise<CancelPurchaseOrderUseCaseResponse> {
    const { tenantId, id, userId } = request;

    const purchaseOrder = await this.purchaseOrdersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!purchaseOrder) {
      throw new ResourceNotFoundError('Purchase order not found');
    }

    try {
      purchaseOrder.cancel();
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    await this.purchaseOrdersRepository.save(purchaseOrder);

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
      action: 'STOCK_PO_CANCELLED',
      entity: 'PURCHASE_ORDER',
      entityId: id,
      module: 'stock',
      description: `Pedido de compra ${purchaseOrder.orderNumber} cancelado`,
      oldData: { status: 'CONFIRMED' },
      newData: { status: 'CANCELLED', orderId: id, tenantId },
    });

    return { purchaseOrder: purchaseOrderToDTO(purchaseOrder) };
  }
}
