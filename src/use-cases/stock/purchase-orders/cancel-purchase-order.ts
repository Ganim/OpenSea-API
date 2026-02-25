import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PurchaseOrderDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';
import type { CalendarSyncService } from '@/services/calendar/calendar-sync.service';

interface CancelPurchaseOrderUseCaseRequest {
  tenantId: string;
  id: string;
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
    const { tenantId, id } = request;

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

    return { purchaseOrder: purchaseOrderToDTO(purchaseOrder) };
  }
}
