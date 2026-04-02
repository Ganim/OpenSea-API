import { InMemoryPosTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-transactions-repository';
import { PosTransaction } from '@/entities/sales/pos-transaction';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPosTransactionsUseCase } from './list-pos-transactions';

let posTransactionsRepository: InMemoryPosTransactionsRepository;
let sut: ListPosTransactionsUseCase;

describe('ListPosTransactionsUseCase', () => {
  beforeEach(() => {
    posTransactionsRepository = new InMemoryPosTransactionsRepository();
    sut = new ListPosTransactionsUseCase(posTransactionsRepository);
  });

  it('should list transactions with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await posTransactionsRepository.create(
        PosTransaction.create({
          tenantId: new UniqueEntityID('tenant-1'),
          sessionId: new UniqueEntityID('session-1'),
          orderId: new UniqueEntityID(`order-${i}`),
          transactionNumber: i + 1,
          subtotal: 100,
          grandTotal: 100,
        }),
      );
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 3,
    });

    expect(result.transactions).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no transactions exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(result.transactions).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should filter by sessionId', async () => {
    await posTransactionsRepository.create(
      PosTransaction.create({
        tenantId: new UniqueEntityID('tenant-1'),
        sessionId: new UniqueEntityID('session-1'),
        orderId: new UniqueEntityID('order-1'),
        transactionNumber: 1,
        subtotal: 100,
        grandTotal: 100,
      }),
    );
    await posTransactionsRepository.create(
      PosTransaction.create({
        tenantId: new UniqueEntityID('tenant-1'),
        sessionId: new UniqueEntityID('session-2'),
        orderId: new UniqueEntityID('order-2'),
        transactionNumber: 1,
        subtotal: 50,
        grandTotal: 50,
      }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      sessionId: 'session-1',
    });

    expect(result.transactions).toHaveLength(1);
  });

  it('should filter by status', async () => {
    await posTransactionsRepository.create(
      PosTransaction.create({
        tenantId: new UniqueEntityID('tenant-1'),
        sessionId: new UniqueEntityID('session-1'),
        orderId: new UniqueEntityID('order-1'),
        transactionNumber: 1,
        status: 'COMPLETED',
        subtotal: 100,
        grandTotal: 100,
      }),
    );
    await posTransactionsRepository.create(
      PosTransaction.create({
        tenantId: new UniqueEntityID('tenant-1'),
        sessionId: new UniqueEntityID('session-1'),
        orderId: new UniqueEntityID('order-2'),
        transactionNumber: 2,
        status: 'CANCELLED',
        subtotal: 50,
        grandTotal: 50,
      }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      status: 'COMPLETED',
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].status).toBe('COMPLETED');
  });
});
