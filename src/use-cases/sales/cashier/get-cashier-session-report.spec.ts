import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CashierSession } from '@/entities/sales/cashier-session';
import { CashierTransaction } from '@/entities/sales/cashier-transaction';
import { InMemoryCashierSessionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-sessions-repository';
import { InMemoryCashierTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-cashier-transactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCashierSessionReportUseCase } from './get-cashier-session-report';

let cashierSessionsRepository: InMemoryCashierSessionsRepository;
let cashierTransactionsRepository: InMemoryCashierTransactionsRepository;
let sut: GetCashierSessionReportUseCase;

const tenantId = 'tenant-1';

describe('GetCashierSessionReportUseCase', () => {
  beforeEach(() => {
    cashierSessionsRepository = new InMemoryCashierSessionsRepository();
    cashierTransactionsRepository =
      new InMemoryCashierTransactionsRepository();

    sut = new GetCashierSessionReportUseCase(
      cashierSessionsRepository,
      cashierTransactionsRepository,
    );
  });

  it('should return a report for a session with transactions', async () => {
    const session = CashierSession.create({
      tenantId: new UniqueEntityID(tenantId),
      cashierId: 'cashier-1',
      openingBalance: 100,
    });
    cashierSessionsRepository.items.push(session);

    const saleTransaction = CashierTransaction.create({
      sessionId: session.id,
      type: 'SALE',
      amount: 200,
      paymentMethod: 'CASH',
      createdAt: new Date('2026-04-13T10:30:00'),
    });

    const refundTransaction = CashierTransaction.create({
      sessionId: session.id,
      type: 'REFUND',
      amount: 50,
      paymentMethod: 'CASH',
      createdAt: new Date('2026-04-13T11:00:00'),
    });

    const cashInTransaction = CashierTransaction.create({
      sessionId: session.id,
      type: 'CASH_IN',
      amount: 300,
    });

    const cashOutTransaction = CashierTransaction.create({
      sessionId: session.id,
      type: 'CASH_OUT',
      amount: 80,
    });

    cashierTransactionsRepository.items.push(
      saleTransaction,
      refundTransaction,
      cashInTransaction,
      cashOutTransaction,
    );

    const result = await sut.execute({
      tenantId,
      sessionId: session.id.toString(),
    });

    expect(result.sessionId).toBe(session.id.toString());
    expect(result.status).toBe('OPEN');
    expect(result.openingBalance).toBe(100);
    expect(result.totals.sales).toBe(200);
    expect(result.totals.refunds).toBe(50);
    expect(result.totals.cashIn).toBe(300);
    expect(result.totals.cashOut).toBe(80);
    expect(result.totals.netSales).toBe(150);
    expect(result.totals.transactions).toBe(4);
    expect(result.paymentMethods).toHaveLength(1);
    expect(result.paymentMethods[0].method).toBe('CASH');
    expect(result.hourlySales.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty totals for session with no transactions', async () => {
    const session = CashierSession.create({
      tenantId: new UniqueEntityID(tenantId),
      cashierId: 'cashier-1',
      openingBalance: 50,
    });
    cashierSessionsRepository.items.push(session);

    const result = await sut.execute({
      tenantId,
      sessionId: session.id.toString(),
    });

    expect(result.totals.sales).toBe(0);
    expect(result.totals.refunds).toBe(0);
    expect(result.totals.netSales).toBe(0);
    expect(result.totals.transactions).toBe(0);
    expect(result.paymentMethods).toHaveLength(0);
    expect(result.hourlySales).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError for non-existing session', async () => {
    await expect(
      sut.execute({
        tenantId,
        sessionId: 'non-existing-session',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
