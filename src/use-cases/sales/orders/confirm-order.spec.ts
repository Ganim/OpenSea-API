import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConfirmOrderUseCase } from './confirm-order';

let ordersRepository: InMemoryOrdersRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: ConfirmOrderUseCase;

const tenantId = 'tenant-1';
const pipelineId = new UniqueEntityID();
let draftStageId: UniqueEntityID;
let approvedStageId: UniqueEntityID;

describe('Confirm Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    sut = new ConfirmOrderUseCase(ordersRepository, pipelineStagesRepository);

    const draftStage = PipelineStage.create({
      pipelineId,
      name: 'Rascunho',
      type: 'DRAFT',
      position: 0,
    });
    const approvedStage = PipelineStage.create({
      pipelineId,
      name: 'Aprovado',
      type: 'APPROVED',
      position: 2,
    });
    pipelineStagesRepository.items.push(draftStage, approvedStage);
    draftStageId = draftStage.id;
    approvedStageId = approvedStage.id;
  });

  it('should confirm an order in DRAFT stage', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      pipelineId,
      stageId: draftStageId,
    });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
      userId: 'user-1',
    });

    expect(result.order.stageId.toString()).toBe(approvedStageId.toString());
    expect(result.order.confirmedAt).toBeTruthy();
    expect(result.order.approvedByUserId?.toString()).toBe('user-1');
  });

  it('should not confirm a non-existing order', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existing',
        tenantId,
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not confirm an order already in APPROVED stage', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      pipelineId,
      stageId: approvedStageId,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        orderId: order.id.toString(),
        tenantId,
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
