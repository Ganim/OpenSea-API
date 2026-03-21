import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeOrderStageUseCase } from './change-order-stage';

let ordersRepository: InMemoryOrdersRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: ChangeOrderStageUseCase;

const tenantId = 'tenant-1';
const pipelineId = new UniqueEntityID();
let draftStageId: UniqueEntityID;
let processingStageId: UniqueEntityID;

describe('Change Order Stage', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new ChangeOrderStageUseCase(
      ordersRepository,
      pipelineStagesRepository,
    );

    const draftStage = PipelineStage.create({
      pipelineId,
      name: 'Rascunho',
      type: 'DRAFT',
      position: 0,
    });
    const processingStage = PipelineStage.create({
      pipelineId,
      name: 'Separação',
      type: 'PROCESSING',
      position: 3,
    });
    pipelineStagesRepository.items.push(draftStage, processingStage);
    draftStageId = draftStage.id;
    processingStageId = processingStage.id;
  });

  it('should change order stage', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      pipelineId,
      stageId: draftStageId,
    });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
      stageId: processingStageId.toString(),
    });

    expect(result.order.stageId.toString()).toBe(
      processingStageId.toString(),
    );
  });

  it('should not change to a stage from different pipeline', async () => {
    const otherPipelineId = new UniqueEntityID();
    const otherStage = PipelineStage.create({
      pipelineId: otherPipelineId,
      name: 'Other',
      type: 'DRAFT',
      position: 0,
    });
    pipelineStagesRepository.items.push(otherStage);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      pipelineId,
      stageId: draftStageId,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        orderId: order.id.toString(),
        tenantId,
        stageId: otherStage.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not change stage of non-existing order', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existing',
        tenantId,
        stageId: processingStageId.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
