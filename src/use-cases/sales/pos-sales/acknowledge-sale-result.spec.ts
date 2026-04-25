import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Order } from '@/entities/sales/order';
import { OrderOriginSource } from '@/entities/sales/value-objects/order-origin-source';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { AcknowledgeSaleResultUseCase } from './acknowledge-sale-result';

let ordersRepository: InMemoryOrdersRepository;
let sut: AcknowledgeSaleResultUseCase;

const tenantId = 'tenant-ack';
const otherTenantId = 'tenant-other';
const saleLocalUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001';

function buildOrder(
  overrides: {
    tenantId?: string;
    saleLocalUuid?: string | null;
    ackReceivedAt?: Date | null;
  } = {},
): Order {
  return Order.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? tenantId),
    orderNumber: 'PDV-00001',
    type: 'ORDER',
    status: 'CONFIRMED',
    customerId: new UniqueEntityID('customer-1'),
    pipelineId: new UniqueEntityID('pipeline-pdv'),
    stageId: new UniqueEntityID('stage-open'),
    channel: 'PDV',
    subtotal: 100,
    originSource: OrderOriginSource.POS_DESKTOP(),
    saleLocalUuid: overrides.saleLocalUuid ?? saleLocalUuid,
    ackReceivedAt: overrides.ackReceivedAt ?? null,
  });
}

describe('AcknowledgeSaleResultUseCase', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new AcknowledgeSaleResultUseCase(ordersRepository);
  });

  describe('Order.markAcknowledged()', () => {
    it('sets ackReceivedAt to a fresh timestamp when not yet acknowledged', () => {
      const order = buildOrder();
      expect(order.ackReceivedAt).toBeNull();

      const beforeCall = Date.now();
      order.markAcknowledged();
      const afterCall = Date.now();

      expect(order.ackReceivedAt).toBeInstanceOf(Date);
      const ackedMs = (order.ackReceivedAt as Date).getTime();
      expect(ackedMs).toBeGreaterThanOrEqual(beforeCall);
      expect(ackedMs).toBeLessThanOrEqual(afterCall);
    });

    it('is a no-op when ackReceivedAt is already set (idempotent)', () => {
      const previouslyAckedAt = new Date('2026-04-20T10:00:00Z');
      const order = buildOrder({ ackReceivedAt: previouslyAckedAt });

      order.markAcknowledged();

      expect(order.ackReceivedAt).toBe(previouslyAckedAt);
    });
  });

  describe('execute()', () => {
    it('marks an unacknowledged Order and returns the new timestamp', async () => {
      const order = buildOrder();
      ordersRepository.items.push(order);

      const beforeCall = Date.now();
      const response = await sut.execute({
        tenantId,
        saleLocalUuid,
      });
      const afterCall = Date.now();

      expect(response.success).toBe(true);
      expect(response.ackedAt).toBeInstanceOf(Date);
      const ackedMs = response.ackedAt.getTime();
      expect(ackedMs).toBeGreaterThanOrEqual(beforeCall);
      expect(ackedMs).toBeLessThanOrEqual(afterCall);

      const persistedOrder = ordersRepository.items[0];
      expect(persistedOrder.ackReceivedAt).toEqual(response.ackedAt);
    });

    it('is idempotent: a second call returns the original timestamp without overwriting', async () => {
      const order = buildOrder();
      ordersRepository.items.push(order);

      const firstResponse = await sut.execute({
        tenantId,
        saleLocalUuid,
      });

      // Force a measurable delay so that any accidental overwrite would
      // produce a clearly different timestamp than the first call.
      await new Promise((resolve) => setTimeout(resolve, 5));

      const secondResponse = await sut.execute({
        tenantId,
        saleLocalUuid,
      });

      expect(secondResponse.success).toBe(true);
      expect(secondResponse.ackedAt.getTime()).toBe(
        firstResponse.ackedAt.getTime(),
      );
      expect(ordersRepository.items[0].ackReceivedAt).toEqual(
        firstResponse.ackedAt,
      );
    });

    it('throws ResourceNotFoundError when no Order matches the saleLocalUuid', async () => {
      await expect(() =>
        sut.execute({
          tenantId,
          saleLocalUuid: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        }),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it('throws ResourceNotFoundError when the Order belongs to another tenant', async () => {
      const order = buildOrder({ tenantId: otherTenantId });
      ordersRepository.items.push(order);

      await expect(() =>
        sut.execute({
          tenantId,
          saleLocalUuid,
        }),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });
});
