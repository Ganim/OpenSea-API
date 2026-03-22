import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface ChangeOrderStageUseCaseRequest {
  orderId: string;
  tenantId: string;
  stageId: string;
}

interface ChangeOrderStageUseCaseResponse {
  order: Order;
}

export class ChangeOrderStageUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
  ) {}

  async execute(
    input: ChangeOrderStageUseCaseRequest,
  ): Promise<ChangeOrderStageUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    // Validate the new stage exists and belongs to the same pipeline
    const newStage = await this.pipelineStagesRepository.findById(
      new UniqueEntityID(input.stageId),
    );

    if (!newStage) {
      throw new ResourceNotFoundError('Stage not found.');
    }

    if (newStage.pipelineId.toString() !== order.pipelineId.toString()) {
      throw new BadRequestError('Stage does not belong to the order pipeline.');
    }

    order.stageId = new UniqueEntityID(input.stageId);

    await this.ordersRepository.save(order);

    return { order };
  }
}
