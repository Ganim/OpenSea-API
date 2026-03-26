import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosSession } from '@/entities/sales/pos-session';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { InMemoryPosTransactionPaymentsRepository } from '@/repositories/sales/in-memory/in-memory-pos-transaction-payments-repository';
import { InMemoryPosTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePosTransactionUseCase } from './create-pos-transaction';

let posTransactionsRepository: InMemoryPosTransactionsRepository;
let posTransactionPaymentsRepository: InMemoryPosTransactionPaymentsRepository;
let posSessionsRepository: InMemoryPosSessionsRepository;
let createPosTransaction: CreatePosTransactionUseCase;

const TENANT_ID = 'tenant-1';

function createOpenSession(sessionId = 'session-1'): PosSession {
  return PosSession.create({
    id: new UniqueEntityID(sessionId),
    tenantId: new UniqueEntityID(TENANT_ID),
    terminalId: new UniqueEntityID('terminal-1'),
    operatorUserId: new UniqueEntityID('operator-1'),
    status: 'OPEN',
    openingBalance: 200,
  });
}

describe('CreatePosTransactionUseCase', () => {
  beforeEach(() => {
    posTransactionsRepository = new InMemoryPosTransactionsRepository();
    posTransactionPaymentsRepository =
      new InMemoryPosTransactionPaymentsRepository();
    posSessionsRepository = new InMemoryPosSessionsRepository();
    createPosTransaction = new CreatePosTransactionUseCase(
      posTransactionsRepository,
      posTransactionPaymentsRepository,
      posSessionsRepository,
    );
  });

  it('should be able to create a POS transaction with a cash payment', async () => {
    posSessionsRepository.items.push(createOpenSession());

    const { transaction, payments } = await createPosTransaction.execute({
      tenantId: TENANT_ID,
      sessionId: 'session-1',
      orderId: 'order-1',
      subtotal: 100,
      grandTotal: 100,
      payments: [{ method: 'CASH', amount: 100 }],
    });

    expect(transaction).toBeDefined();
    expect(transaction.status).toBe('COMPLETED');
    expect(transaction.grandTotal).toBe(100);
    expect(transaction.transactionNumber).toBe(1);
    expect(payments).toHaveLength(1);
    expect(payments[0].method).toBe('CASH');
    expect(posTransactionsRepository.items).toHaveLength(1);
    expect(posTransactionPaymentsRepository.items).toHaveLength(1);
  });

  it('should increment transaction numbers within the same session', async () => {
    posSessionsRepository.items.push(createOpenSession());

    const { transaction: firstTransaction } =
      await createPosTransaction.execute({
        tenantId: TENANT_ID,
        sessionId: 'session-1',
        orderId: 'order-1',
        subtotal: 50,
        grandTotal: 50,
        payments: [{ method: 'CASH', amount: 50 }],
      });

    const { transaction: secondTransaction } =
      await createPosTransaction.execute({
        tenantId: TENANT_ID,
        sessionId: 'session-1',
        orderId: 'order-2',
        subtotal: 75,
        grandTotal: 75,
        payments: [{ method: 'PIX', amount: 75 }],
      });

    expect(firstTransaction.transactionNumber).toBe(1);
    expect(secondTransaction.transactionNumber).toBe(2);
  });

  it('should support multiple payment methods', async () => {
    posSessionsRepository.items.push(createOpenSession());

    const { payments } = await createPosTransaction.execute({
      tenantId: TENANT_ID,
      sessionId: 'session-1',
      orderId: 'order-1',
      subtotal: 200,
      grandTotal: 200,
      payments: [
        { method: 'CASH', amount: 100 },
        { method: 'CREDIT_CARD', amount: 100 },
      ],
    });

    expect(payments).toHaveLength(2);
    expect(posTransactionPaymentsRepository.items).toHaveLength(2);
  });

  it('should not create a transaction for a non-existent session', async () => {
    await expect(() =>
      createPosTransaction.execute({
        tenantId: TENANT_ID,
        sessionId: 'non-existent-session',
        orderId: 'order-1',
        subtotal: 100,
        grandTotal: 100,
        payments: [{ method: 'CASH', amount: 100 }],
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create a transaction on a closed session', async () => {
    const closedSession = PosSession.create({
      id: new UniqueEntityID('closed-session'),
      tenantId: new UniqueEntityID(TENANT_ID),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('operator-1'),
      status: 'CLOSED',
      openingBalance: 100,
    });
    posSessionsRepository.items.push(closedSession);

    await expect(() =>
      createPosTransaction.execute({
        tenantId: TENANT_ID,
        sessionId: 'closed-session',
        orderId: 'order-1',
        subtotal: 100,
        grandTotal: 100,
        payments: [{ method: 'CASH', amount: 100 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a transaction when payment total is less than grand total', async () => {
    posSessionsRepository.items.push(createOpenSession());

    await expect(() =>
      createPosTransaction.execute({
        tenantId: TENANT_ID,
        sessionId: 'session-1',
        orderId: 'order-1',
        subtotal: 200,
        grandTotal: 200,
        payments: [{ method: 'CASH', amount: 100 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should handle customer information', async () => {
    posSessionsRepository.items.push(createOpenSession());

    const { transaction } = await createPosTransaction.execute({
      tenantId: TENANT_ID,
      sessionId: 'session-1',
      orderId: 'order-1',
      subtotal: 100,
      grandTotal: 100,
      customerId: 'customer-1',
      customerName: 'João Silva',
      customerDocument: '12345678901',
      payments: [{ method: 'CASH', amount: 100 }],
    });

    expect(transaction.customerId?.toString()).toBe('customer-1');
    expect(transaction.customerName).toBe('João Silva');
    expect(transaction.customerDocument).toBe('12345678901');
  });
});
