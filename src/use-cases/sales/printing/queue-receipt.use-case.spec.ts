import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { InMemoryPrintJobsRepository } from '@/repositories/sales/in-memory/in-memory-print-jobs-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { QueueReceiptUseCase } from './queue-receipt.use-case';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let printersRepository: InMemoryPosPrintersRepository;
let printJobsRepository: InMemoryPrintJobsRepository;
let sut: QueueReceiptUseCase;

describe('QueueReceiptUseCase', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    printersRepository = new InMemoryPosPrintersRepository();
    printJobsRepository = new InMemoryPrintJobsRepository();

    sut = new QueueReceiptUseCase(
      ordersRepository,
      orderItemsRepository,
      printersRepository,
      printJobsRepository,
    );
  });

  it('should queue receipt for valid order and default printer', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID('tenant-1') });
    await ordersRepository.create(order);

    await orderItemsRepository.create(
      makeOrderItem({
        tenantId: new UniqueEntityID('tenant-1'),
        orderId: order.id,
        name: 'Item 1',
      }),
    );

    const printer = PosPrinter.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Default Printer',
      type: 'THERMAL',
      connection: 'USB',
      deviceId: 'USB001',
      isDefault: true,
    });
    await printersRepository.create(printer);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      orderId: order.id.toString(),
    });

    expect(result.status).toBe('queued');
    expect(result.jobId).toBeDefined();
    expect(printJobsRepository.items).toHaveLength(1);
  });

  it('should fail when order does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', orderId: 'missing' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when no printer is available', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID('tenant-1') });
    await ordersRepository.create(order);

    await orderItemsRepository.create(
      makeOrderItem({
        tenantId: new UniqueEntityID('tenant-1'),
        orderId: order.id,
      }),
    );

    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', orderId: order.id.toString() }),
    ).rejects.toThrow(BadRequestError);
  });
});
