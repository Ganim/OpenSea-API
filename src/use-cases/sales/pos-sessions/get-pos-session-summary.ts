import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosCashMovementsRepository } from '@/repositories/sales/pos-cash-movements-repository';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';
import { prisma } from '@/lib/prisma';

export interface PaymentMethodBreakdown {
  method: string;
  total: number;
  count: number;
}

export interface SessionSummaryResponse {
  sessionId: string;
  openingBalance: number;
  totalSales: number;
  transactionCount: number;
  cancelledCount: number;
  paymentBreakdown: PaymentMethodBreakdown[];
  totalSupplies: number;
  totalWithdrawals: number;
  totalCashReceived: number;
  totalChangeGiven: number;
  expectedCashBalance: number;
}

interface GetPosSessionSummaryRequest {
  tenantId: string;
  sessionId: string;
}

export class GetPosSessionSummaryUseCase {
  constructor(
    private posSessionsRepository: PosSessionsRepository,
    private posCashMovementsRepository: PosCashMovementsRepository,
  ) {}

  async execute(
    request: GetPosSessionSummaryRequest,
  ): Promise<SessionSummaryResponse> {
    const session = await this.posSessionsRepository.findById(
      new UniqueEntityID(request.sessionId),
      request.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Session not found.');
    }

    // Get cash movements
    const movements = await this.posCashMovementsRepository.findBySessionId(
      request.sessionId,
    );

    let totalSupplies = 0;
    let totalWithdrawals = 0;
    const openingBalance = session.openingBalance;

    for (const mov of movements) {
      switch (mov.type) {
        case 'SUPPLY':
          totalSupplies += mov.amount;
          break;
        case 'WITHDRAWAL':
          totalWithdrawals += mov.amount;
          break;
      }
    }

    // Get payment breakdown grouped by method using raw Prisma query
    const paymentStats = await prisma.posTransactionPayment.groupBy({
      by: ['method'],
      where: {
        transaction: {
          sessionId: request.sessionId,
          status: 'COMPLETED',
        },
      },
      _sum: {
        amount: true,
        receivedAmount: true,
        changeAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const paymentBreakdown: PaymentMethodBreakdown[] = paymentStats.map(
      (stat) => ({
        method: stat.method,
        total: stat._sum.amount?.toNumber() ?? 0,
        count: stat._count.id,
      }),
    );

    // Calculate totals from payments
    let totalSales = 0;
    let totalCashReceived = 0;
    let totalChangeGiven = 0;

    for (const stat of paymentStats) {
      totalSales += stat._sum.amount?.toNumber() ?? 0;
      if (stat.method === 'CASH') {
        totalCashReceived += stat._sum.receivedAmount?.toNumber() ?? 0;
        totalChangeGiven += stat._sum.changeAmount?.toNumber() ?? 0;
      }
    }

    // Get cash amount from payment breakdown
    const cashPayments =
      paymentBreakdown.find((b) => b.method === 'CASH')?.total ?? 0;

    // Expected cash = opening + cash sales + supplies - withdrawals
    const expectedCashBalance =
      openingBalance + cashPayments + totalSupplies - totalWithdrawals;

    // Transaction counts
    const transactionCounts = await prisma.posTransaction.groupBy({
      by: ['status'],
      where: {
        sessionId: request.sessionId,
      },
      _count: {
        id: true,
      },
    });

    const completedCount =
      transactionCounts.find((c) => c.status === 'COMPLETED')?._count.id ?? 0;
    const cancelledCount =
      transactionCounts.find((c) => c.status === 'CANCELLED')?._count.id ?? 0;

    return {
      sessionId: request.sessionId,
      openingBalance,
      totalSales,
      transactionCount: completedCount,
      cancelledCount,
      paymentBreakdown,
      totalSupplies,
      totalWithdrawals,
      totalCashReceived,
      totalChangeGiven,
      expectedCashBalance,
    };
  }
}
