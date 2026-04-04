import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePdvOrderUseCase } from './create-pdv-order';

let ordersRepository: InMemoryOrdersRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let customersRepository: InMemoryCustomersRepository;
let sut: CreatePdvOrderUseCase;

const tenantId = 'tenant-1';

function createPdvPipeline(): Pipeline {
  return Pipeline.create({
    tenantId: new UniqueEntityID(tenantId),
    name: 'PDV',
    type: 'PDV',
  });
}

function createPdvStage(pipelineId: UniqueEntityID): PipelineStage {
  return PipelineStage.create({
    pipelineId,
    name: 'Rascunho',
    type: 'DRAFT',
    position: 0,
  });
}

function createSystemCustomer(): Customer {
  return Customer.create(
    {
      tenantId: new UniqueEntityID(tenantId),
      name: 'Consumidor Final',
      type: CustomerType.create('INDIVIDUAL'),
      isSystem: true,
    },
    new UniqueEntityID(),
  );
}

describe('Create PDV Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    customersRepository = new InMemoryCustomersRepository();

    sut = new CreatePdvOrderUseCase(
      ordersRepository,
      pipelinesRepository,
      pipelineStagesRepository,
      customersRepository,
    );
  });

  it('should create a PDV order with system default customer when no customer provided', async () => {
    const pipeline = createPdvPipeline();
    pipelinesRepository.items.push(pipeline);

    const stage = createPdvStage(pipeline.id);
    pipelineStagesRepository.items.push(stage);

    const systemCustomer = createSystemCustomer();
    customersRepository.items.push(systemCustomer);

    const result = await sut.execute({
      tenantId,
      assignedToUserId: 'user-1',
    });

    expect(result.order).toBeTruthy();
    expect(result.order.channel).toBe('PDV');
    expect(result.order.type).toBe('ORDER');
    expect(result.order.status).toBe('DRAFT');
    expect(result.order.subtotal).toBe(0);
    expect(result.order.grandTotal).toBe(0);
    expect(result.order.saleCode).toBeTruthy();
    expect(result.order.saleCode!.length).toBeGreaterThanOrEqual(6);
    expect(result.order.customerId.toString()).toBe(
      systemCustomer.id.toString(),
    );
    expect(result.order.assignedToUserId?.toString()).toBe('user-1');
    expect(result.order.pipelineId.toString()).toBe(pipeline.id.toString());
    expect(result.order.stageId.toString()).toBe(stage.id.toString());
    expect(ordersRepository.items).toHaveLength(1);
  });

  it('should create a PDV order with a specific customer', async () => {
    const pipeline = createPdvPipeline();
    pipelinesRepository.items.push(pipeline);

    const stage = createPdvStage(pipeline.id);
    pipelineStagesRepository.items.push(stage);

    const specificCustomer = Customer.create(
      {
        tenantId: new UniqueEntityID(tenantId),
        name: 'Maria Silva',
        type: CustomerType.create('INDIVIDUAL'),
      },
      new UniqueEntityID(),
    );
    customersRepository.items.push(specificCustomer);

    const result = await sut.execute({
      tenantId,
      assignedToUserId: 'user-1',
      customerId: specificCustomer.id.toString(),
    });

    expect(result.order.customerId.toString()).toBe(
      specificCustomer.id.toString(),
    );
  });

  it('should throw if PDV pipeline not found', async () => {
    const systemCustomer = createSystemCustomer();
    customersRepository.items.push(systemCustomer);

    await expect(
      sut.execute({
        tenantId,
        assignedToUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if PDV pipeline has no stages', async () => {
    const pipeline = createPdvPipeline();
    pipelinesRepository.items.push(pipeline);
    // No stages added

    await expect(
      sut.execute({
        tenantId,
        assignedToUserId: 'user-1',
      }),
    ).rejects.toThrow('PDV pipeline has no stages configured.');
  });

  it('should throw if specified customer not found', async () => {
    const pipeline = createPdvPipeline();
    pipelinesRepository.items.push(pipeline);

    const stage = createPdvStage(pipeline.id);
    pipelineStagesRepository.items.push(stage);

    await expect(
      sut.execute({
        tenantId,
        assignedToUserId: 'user-1',
        customerId: 'non-existing-customer',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if no system default customer and no customer provided', async () => {
    const pipeline = createPdvPipeline();
    pipelinesRepository.items.push(pipeline);

    const stage = createPdvStage(pipeline.id);
    pipelineStagesRepository.items.push(stage);

    await expect(
      sut.execute({
        tenantId,
        assignedToUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should generate unique sale codes for multiple orders', async () => {
    const pipeline = createPdvPipeline();
    pipelinesRepository.items.push(pipeline);

    const stage = createPdvStage(pipeline.id);
    pipelineStagesRepository.items.push(stage);

    const systemCustomer = createSystemCustomer();
    customersRepository.items.push(systemCustomer);

    const result1 = await sut.execute({
      tenantId,
      assignedToUserId: 'user-1',
    });

    const result2 = await sut.execute({
      tenantId,
      assignedToUserId: 'user-1',
    });

    expect(result1.order.saleCode).not.toBe(result2.order.saleCode);
  });
});
