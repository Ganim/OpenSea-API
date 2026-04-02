import { InMemoryPosTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-transactions-repository';
import { PosTransaction } from '@/entities/sales/pos-transaction';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelPosTransactionUseCase } from './cancel-pos-transaction';

let posTransactionsRepository: InMemoryPosTransactionsRepository;
let sut: CancelPosTransactionUseCase;

describe('CancelPosTransactionUseCase', () => {
  beforeEach(() => {
    posTransactionsRepository = new InMemoryPosTransactionsRepository();
    sut = new CancelPosTransactionUseCase(posTransactionsRepository);
  });

  it('should cancel a completed transaction', async () => {
    const transaction = PosTransaction.create({
      tenantId: new UniqueEntityID('tenant-1'),
      sessionId: new UniqueEntityID('session-1'),
      orderId: new UniqueEntityID('order-1'),
      transactionNumber: 1,
      status: 'COMPLETED',
      subtotal: 100,
      grandTotal: 100,
    });
    await posTransactionsRepository.create(transaction);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      transactionId: transaction.id.toString(),
    });

    expect(result.transaction.status).toBe('CANCELLED');
  });

  it('should throw if transaction is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        transactionId: 'non-existent',
      }),
    ).rejects.toThrow('Transaction not found.');
  });

  it('should throw if transaction is not completed', async () => {
    const transaction = PosTransaction.create({
      tenantId: new UniqueEntityID('tenant-1'),
      sessionId: new UniqueEntityID('session-1'),
      orderId: new UniqueEntityID('order-1'),
      transactionNumber: 1,
      status: 'CANCELLED',
      subtotal: 100,
      grandTotal: 100,
    });
    await posTransactionsRepository.create(transaction);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        transactionId: transaction.id.toString(),
      }),
    ).rejects.toThrow('Only completed transactions can be cancelled.');
  });

  it('should throw if transaction is suspended', async () => {
    const transaction = PosTransaction.create({
      tenantId: new UniqueEntityID('tenant-1'),
      sessionId: new UniqueEntityID('session-1'),
      orderId: new UniqueEntityID('order-1'),
      transactionNumber: 1,
      status: 'SUSPENDED',
      subtotal: 50,
      grandTotal: 50,
    });
    await posTransactionsRepository.create(transaction);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        transactionId: transaction.id.toString(),
      }),
    ).rejects.toThrow('Only completed transactions can be cancelled.');
  });
});
