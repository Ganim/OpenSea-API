import type { Order } from '@/entities/sales/order';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { AddOrderItemUseCase } from './add-order-item';
import type { CreatePdvOrderUseCase } from './create-pdv-order';
import type { SendToCashierUseCase } from './send-to-cashier';

interface OfflineOrderItemInput {
  variantId: string;
  quantity?: number;
}

interface OfflineOrderInput {
  offlineRef?: string;
  customerId?: string;
  terminalId?: string;
  sendToCashier?: boolean;
  items: OfflineOrderItemInput[];
}

interface SyncOfflineOrdersUseCaseRequest {
  tenantId: string;
  userId: string;
  orders: OfflineOrderInput[];
}

interface SyncResultItem {
  offlineRef?: string;
  order?: Order;
  error?: string;
}

interface SyncOfflineOrdersUseCaseResponse {
  synced: SyncResultItem[];
  failed: SyncResultItem[];
}

export class SyncOfflineOrdersUseCase {
  constructor(
    private createPdvOrderUseCase: CreatePdvOrderUseCase,
    private addOrderItemUseCase: AddOrderItemUseCase,
    private sendToCashierUseCase: SendToCashierUseCase,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute(
    input: SyncOfflineOrdersUseCaseRequest,
  ): Promise<SyncOfflineOrdersUseCaseResponse> {
    const synced: SyncResultItem[] = [];
    const failed: SyncResultItem[] = [];

    for (const offlineOrder of input.orders) {
      try {
        const normalizedOfflineRef = offlineOrder.offlineRef
          ?.trim()
          .toUpperCase();

        if (normalizedOfflineRef) {
          const existingOrder = await this.ordersRepository.findBySaleCode(
            normalizedOfflineRef,
            input.tenantId,
          );

          if (existingOrder) {
            synced.push({
              offlineRef: normalizedOfflineRef,
              order: existingOrder,
            });
            continue;
          }
        }

        const { order } = await this.createPdvOrderUseCase.execute({
          tenantId: input.tenantId,
          assignedToUserId: input.userId,
          customerId: offlineOrder.customerId,
          terminalId: offlineOrder.terminalId,
        });

        if (normalizedOfflineRef) {
          order.saleCode = normalizedOfflineRef;
          await this.ordersRepository.save(order);
        }

        for (const item of offlineOrder.items) {
          await this.addOrderItemUseCase.execute({
            tenantId: input.tenantId,
            orderId: order.id.toString(),
            variantId: item.variantId,
            quantity: item.quantity,
          });
        }

        if (offlineOrder.sendToCashier) {
          await this.sendToCashierUseCase.execute({
            tenantId: input.tenantId,
            orderId: order.id.toString(),
          });
        }

        const finalOrder = await this.ordersRepository.findById(
          order.id,
          input.tenantId,
        );

        synced.push({
          offlineRef: normalizedOfflineRef,
          order: finalOrder ?? order,
        });
      } catch (error) {
        failed.push({
          offlineRef: offlineOrder.offlineRef,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { synced, failed };
  }
}
