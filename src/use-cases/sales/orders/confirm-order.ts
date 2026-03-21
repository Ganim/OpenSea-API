import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import { SALES_EVENTS } from '@/lib/events/sales-events';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface ConfirmOrderUseCaseRequest {
  orderId: string;
  tenantId: string;
  userId: string;
}

interface ConfirmOrderUseCaseResponse {
  order: Order;
}

export class ConfirmOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
    private orderItemsRepository?: OrderItemsRepository,
  ) {}

  async execute(
    input: ConfirmOrderUseCaseRequest,
  ): Promise<ConfirmOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    // Check current stage is DRAFT type
    const currentStage = await this.pipelineStagesRepository.findById(
      order.stageId,
    );
    if (!currentStage) {
      throw new ResourceNotFoundError('Current stage not found.');
    }

    if (
      currentStage.type !== 'DRAFT' &&
      currentStage.type !== 'PENDING_APPROVAL'
    ) {
      throw new BadRequestError(
        'Only orders in DRAFT or PENDING_APPROVAL stage can be confirmed.',
      );
    }

    // Find APPROVED stage in the same pipeline
    const pipelineStages =
      await this.pipelineStagesRepository.findManyByPipeline(order.pipelineId);
    const approvedStage = pipelineStages.find((s) => s.type === 'APPROVED');

    if (!approvedStage) {
      throw new BadRequestError(
        'No APPROVED stage found in the order pipeline.',
      );
    }

    order.stageId = approvedStage.id;
    order.confirm(new UniqueEntityID(input.userId));

    await this.ordersRepository.save(order);

    // Emit domain event for cross-module consumers
    try {
      const items = this.orderItemsRepository
        ? (await this.orderItemsRepository.findManyByOrder(
            order.id,
            input.tenantId,
          )).map((item) => ({
            variantId: item.variantId?.toString() ?? '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        : [];

      await getTypedEventBus().publish({
        type: SALES_EVENTS.ORDER_CONFIRMED,
        version: 1,
        tenantId: input.tenantId,
        source: 'sales',
        sourceEntityType: 'order',
        sourceEntityId: order.id.toString(),
        data: {
          orderId: order.id.toString(),
          customerId: order.customerId.toString(),
          items,
          total: order.grandTotal,
        },
        metadata: {
          userId: input.userId,
        },
      });
    } catch {
      // Event emission failure should not block the order confirmation
    }

    return { order };
  }
}
