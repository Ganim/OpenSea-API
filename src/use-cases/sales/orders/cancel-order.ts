import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface CancelOrderUseCaseRequest {
  orderId: string;
  tenantId: string;
  reason?: string;
}

interface CancelOrderUseCaseResponse {
  order: Order;
}

export class CancelOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
  ) {}

  async execute(
    input: CancelOrderUseCaseRequest,
  ): Promise<CancelOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    // Check current stage is not already COMPLETED or CANCELLED
    const currentStage = await this.pipelineStagesRepository.findById(
      order.stageId,
    );
    if (currentStage) {
      if (
        currentStage.type === 'COMPLETED' ||
        currentStage.type === 'CANCELLED'
      ) {
        throw new BadRequestError(
          'Cannot cancel an order that is already completed or cancelled.',
        );
      }
    }

    // Find CANCELLED stage in the same pipeline
    const pipelineStages =
      await this.pipelineStagesRepository.findManyByPipeline(order.pipelineId);
    const cancelledStage = pipelineStages.find(
      (s) => s.type === 'CANCELLED',
    );

    if (cancelledStage) {
      order.stageId = cancelledStage.id;
    }

    order.cancel(input.reason);

    await this.ordersRepository.save(order);

    return { order };
  }
}
