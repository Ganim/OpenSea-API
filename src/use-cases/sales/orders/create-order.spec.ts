import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateOrderUseCase } from './create-order';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let customersRepository: InMemoryCustomersRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let sut: CreateOrderUseCase;

const tenantId = 'tenant-1';
let pipelineId: string;
let stageId: string;

describe('Create Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    customersRepository = new InMemoryCustomersRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();

    sut = new CreateOrderUseCase(
      ordersRepository,
      orderItemsRepository,
      customersRepository,
      pipelinesRepository,
      pipelineStagesRepository,
    );

    // Setup pipeline and stage
    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Venda B2B',
      type: 'ORDER_B2B',
    });
    pipelinesRepository.items.push(pipeline);
    pipelineId = pipeline.id.toString();

    const stage = PipelineStage.create({
      pipelineId: pipeline.id,
      name: 'Rascunho',
      type: 'DRAFT',
      position: 0,
    });
    pipelineStagesRepository.items.push(stage);
    stageId = stage.id.toString();
  });

  it('should create an order with items', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      tenantId,
      type: 'ORDER',
      customerId: customer.id.toString(),
      pipelineId,
      stageId,
      channel: 'MANUAL',
      subtotal: 500,
      items: [
        {
          name: 'Product A',
          sku: 'SKU-001',
          quantity: 2,
          unitPrice: 200,
        },
        {
          name: 'Product B',
          quantity: 1,
          unitPrice: 100,
        },
      ],
    });

    expect(result.order).toBeTruthy();
    expect(result.order.orderNumber).toMatch(/^ORD-/);
    expect(result.order.type).toBe('ORDER');
    expect(result.order.channel).toBe('MANUAL');
    expect(result.order.subtotal).toBe(500);
    expect(result.order.grandTotal).toBe(500);
    expect(result.order.remainingAmount).toBe(500);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('Product A');
    expect(result.items[1].name).toBe('Product B');
    expect(ordersRepository.items).toHaveLength(1);
    expect(orderItemsRepository.items).toHaveLength(2);
  });

  it('should create a quote order', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      tenantId,
      type: 'QUOTE',
      customerId: customer.id.toString(),
      pipelineId,
      stageId,
      channel: 'WEB',
      subtotal: 1000,
      items: [{ name: 'Item 1', quantity: 1, unitPrice: 1000 }],
    });

    expect(result.order.type).toBe('QUOTE');
    expect(result.order.channel).toBe('WEB');
  });

  it('should calculate grand total with discounts, tax, and shipping', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      tenantId,
      type: 'ORDER',
      customerId: customer.id.toString(),
      pipelineId,
      stageId,
      channel: 'MANUAL',
      subtotal: 1000,
      discountTotal: 100,
      taxTotal: 50,
      shippingTotal: 30,
      items: [{ name: 'Item 1', quantity: 10, unitPrice: 100 }],
    });

    // grandTotal = subtotal - discount + tax + shipping = 1000 - 100 + 50 + 30 = 980
    expect(result.order.grandTotal).toBe(980);
    expect(result.order.remainingAmount).toBe(980);
  });

  it('should not create an order with non-existing customer', async () => {
    await expect(
      sut.execute({
        tenantId,
        type: 'ORDER',
        customerId: 'non-existing',
        pipelineId,
        stageId,
        channel: 'MANUAL',
        subtotal: 100,
        items: [{ name: 'Item', quantity: 1, unitPrice: 100 }],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not create an order with non-existing pipeline', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    await expect(
      sut.execute({
        tenantId,
        type: 'ORDER',
        customerId: customer.id.toString(),
        pipelineId: 'non-existing',
        stageId,
        channel: 'MANUAL',
        subtotal: 100,
        items: [{ name: 'Item', quantity: 1, unitPrice: 100 }],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not create an order with stage from different pipeline', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    const otherPipeline = Pipeline.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Other Pipeline',
      type: 'ORDER_B2C',
    });
    pipelinesRepository.items.push(otherPipeline);

    await expect(
      sut.execute({
        tenantId,
        type: 'ORDER',
        customerId: customer.id.toString(),
        pipelineId: otherPipeline.id.toString(),
        stageId,
        channel: 'MANUAL',
        subtotal: 100,
        items: [{ name: 'Item', quantity: 1, unitPrice: 100 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create an order without items', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    await expect(
      sut.execute({
        tenantId,
        type: 'ORDER',
        customerId: customer.id.toString(),
        pipelineId,
        stageId,
        channel: 'MANUAL',
        subtotal: 0,
        items: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create an order with item quantity zero', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    await expect(
      sut.execute({
        tenantId,
        type: 'ORDER',
        customerId: customer.id.toString(),
        pipelineId,
        stageId,
        channel: 'MANUAL',
        subtotal: 100,
        items: [{ name: 'Item', quantity: 0, unitPrice: 100 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create an order with negative unit price', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    await expect(
      sut.execute({
        tenantId,
        type: 'ORDER',
        customerId: customer.id.toString(),
        pipelineId,
        stageId,
        channel: 'MANUAL',
        subtotal: 100,
        items: [{ name: 'Item', quantity: 1, unitPrice: -50 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should auto-generate sequential order numbers', async () => {
    const customer = makeCustomer({ tenantId: new UniqueEntityID(tenantId) });
    customersRepository.items.push(customer);

    const result1 = await sut.execute({
      tenantId,
      type: 'ORDER',
      customerId: customer.id.toString(),
      pipelineId,
      stageId,
      channel: 'MANUAL',
      subtotal: 100,
      items: [{ name: 'Item', quantity: 1, unitPrice: 100 }],
    });

    const result2 = await sut.execute({
      tenantId,
      type: 'ORDER',
      customerId: customer.id.toString(),
      pipelineId,
      stageId,
      channel: 'MANUAL',
      subtotal: 200,
      items: [{ name: 'Item 2', quantity: 1, unitPrice: 200 }],
    });

    expect(result1.order.orderNumber).not.toBe(result2.order.orderNumber);
  });
});
