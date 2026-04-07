import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';
import type { CashierTransactionsRepository } from '@/repositories/sales/cashier-transactions-repository';

interface GetCashierSessionReportUseCaseRequest {
  tenantId: string;
  sessionId: string;
}

interface HourlyBucket {
  hour: number;
  amount: number;
}

interface PaymentMethodBucket {
  method: string;
  amount: number;
  count: number;
}

interface GetCashierSessionReportUseCaseResponse {
  sessionId: string;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  totals: {
    sales: number;
    refunds: number;
    cashIn: number;
    cashOut: number;
    netSales: number;
    transactions: number;
  };
  paymentMethods: PaymentMethodBucket[];
  hourlySales: HourlyBucket[];
}

export class GetCashierSessionReportUseCase {
  constructor(
    private cashierSessionsRepository: CashierSessionsRepository,
    private cashierTransactionsRepository: CashierTransactionsRepository,
  ) {}

  async execute(
    input: GetCashierSessionReportUseCaseRequest,
  ): Promise<GetCashierSessionReportUseCaseResponse> {
    const session = await this.cashierSessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Cashier session not found.');
    }

    const transactions =
      await this.cashierTransactionsRepository.findBySessionId(session.id);

    let sales = 0;
    let refunds = 0;
    let cashIn = 0;
    let cashOut = 0;

    const paymentMethodMap = new Map<
      string,
      { amount: number; count: number }
    >();
    const hourlyMap = new Map<number, number>();

    for (const transaction of transactions) {
      if (transaction.type === 'SALE') {
        sales += transaction.amount;
      }
      if (transaction.type === 'REFUND') {
        refunds += transaction.amount;
      }
      if (transaction.type === 'CASH_IN') {
        cashIn += transaction.amount;
      }
      if (transaction.type === 'CASH_OUT') {
        cashOut += transaction.amount;
      }

      if (transaction.type === 'SALE' || transaction.type === 'REFUND') {
        const method = transaction.paymentMethod || 'UNKNOWN';
        const currentMethod = paymentMethodMap.get(method) ?? {
          amount: 0,
          count: 0,
        };
        const sign = transaction.type === 'SALE' ? 1 : -1;

        currentMethod.amount += transaction.amount * sign;
        currentMethod.count += 1;
        paymentMethodMap.set(method, currentMethod);

        const hour = transaction.createdAt.getHours();
        const currentHourAmount = hourlyMap.get(hour) ?? 0;
        hourlyMap.set(hour, currentHourAmount + transaction.amount * sign);
      }
    }

    const paymentMethods: PaymentMethodBucket[] = Array.from(paymentMethodMap)
      .map(([method, value]) => ({
        method,
        amount: value.amount,
        count: value.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const hourlySales: HourlyBucket[] = Array.from(hourlyMap)
      .map(([hour, amount]) => ({ hour, amount }))
      .sort((a, b) => a.hour - b.hour);

    return {
      sessionId: session.id.toString(),
      status: session.status,
      openingBalance: session.openingBalance,
      closingBalance: session.closingBalance,
      expectedBalance: session.expectedBalance,
      difference: session.difference,
      totals: {
        sales,
        refunds,
        cashIn,
        cashOut,
        netSales: sales - refunds,
        transactions: transactions.length,
      },
      paymentMethods,
      hourlySales,
    };
  }
}
