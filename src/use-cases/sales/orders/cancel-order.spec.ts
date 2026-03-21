import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelOrderUseCase } from './cancel-order';

let ordersRepository: InMemoryOrdersRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: CancelOrderUseCase;

const tenantId = 'tenant-1';
const pipelineId = new UniqueEntityID();
let draftStageId: UniqueEntityID;
let cancelledStageId: UniqueEntityID;
let completedStageId: UniqueEntityID;

describe('Cancel Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new CancelOrderUseCase(ordersRepository, pipelineStagesRepository);

    const draftStage = PipelineStage.create({
      pipelineId,
      name: 'Rascunho',
      type: 'DRAFT',
      position: 0,
    });
    const cancelledStage = PipelineStage.create({
      pipelineId,
      name: 'Cancelado',
      type: 'CANCELLED',
      position: 5,
    });
    const completedStage = PipelineStage.create({
      pipelineId,
      name: 'Concluído',
      type: 'COMPLETED',
      position: 4,
    });
    pipelineStagesRepository.items.push(
      draftStage,
      cancelledStage,
      completedStage,
    );
    draftStageId = draftStage.id;
    cancelledStageId = cancelledStage.id;
    completedStageId = completedStage.id;
  });

  it('should cancel an order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      pipelineId,
      stageId: draftStageId,
    });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
      reason: 'Customer requested cancellation',
    });

    expect(result.order.cancelledAt).toBeTruthy();
    expect(result.order.cancelReason).toBe(
      'Customer requested cancellation',
    );
    expect(result.order.stageId.toString()).toBe(
      cancelledStageId.toString(),
    );
  });

  it('should not cancel a completed order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      pipelineId,
      stageId: completedStageId,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        orderId: order.id.toString(),
        tenantId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not cancel an already cancelled order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      pipelineId,
      stageId: cancelledStageId,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        orderId: order.id.toString(),
        tenantId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
