import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConvertQuoteUseCase } from './convert-quote';

let ordersRepository: InMemoryOrdersRepository;
let sut: ConvertQuoteUseCase;

const tenantId = 'tenant-1';

describe('Convert Quote', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new ConvertQuoteUseCase(ordersRepository);
  });

  it('should convert a quote to an order', async () => {
    const quote = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      type: 'QUOTE',
    });
    ordersRepository.items.push(quote);

    const result = await sut.execute({
      orderId: quote.id.toString(),
      tenantId,
    });

    expect(result.order.type).toBe('ORDER');
  });

  it('should not convert an order (not a quote)', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      type: 'ORDER',
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        orderId: order.id.toString(),
        tenantId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not convert a non-existing order', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existing',
        tenantId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
