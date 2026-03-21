import type { PosTransactionPayment } from '@/entities/sales/pos-transaction-payment';
import { prisma } from '@/lib/prisma';
import { posTransactionPaymentPrismaToDomain } from '@/mappers/sales/pos-transaction-payment/pos-transaction-payment-prisma-to-domain';
import type { PosTransactionPaymentsRepository } from '../pos-transaction-payments-repository';
import type {
  PosPaymentMethod as PrismaMethod,
  PosPaymentLinkStatus as PrismaLinkStatus,
} from '@prisma/generated/client.js';

export class PrismaPosTransactionPaymentsRepository
  implements PosTransactionPaymentsRepository
{
  async create(payment: PosTransactionPayment): Promise<void> {
    await prisma.posTransactionPayment.create({
      data: {
        id: payment.id.toString(),
        tenantId: payment.tenantId.toString(),
        transactionId: payment.transactionId.toString(),
        method: payment.method as PrismaMethod,
        amount: payment.amount,
        receivedAmount: payment.receivedAmount ?? null,
        changeAmount: payment.changeAmount ?? null,
        installments: payment.installments,
        authCode: payment.authCode ?? null,
        nsu: payment.nsu ?? null,
        pixTxId: payment.pixTxId ?? null,
        paymentLinkUrl: payment.paymentLinkUrl ?? null,
        paymentLinkStatus: payment.paymentLinkStatus
          ? (payment.paymentLinkStatus as PrismaLinkStatus)
          : null,
        tefTransactionId: payment.tefTransactionId ?? null,
        notes: payment.notes ?? null,
      },
    });
  }

  async createMany(payments: PosTransactionPayment[]): Promise<void> {
    await prisma.posTransactionPayment.createMany({
      data: payments.map((p) => ({
        id: p.id.toString(),
        tenantId: p.tenantId.toString(),
        transactionId: p.transactionId.toString(),
        method: p.method as PrismaMethod,
        amount: p.amount,
        receivedAmount: p.receivedAmount ?? null,
        changeAmount: p.changeAmount ?? null,
        installments: p.installments,
        authCode: p.authCode ?? null,
        nsu: p.nsu ?? null,
        pixTxId: p.pixTxId ?? null,
        paymentLinkUrl: p.paymentLinkUrl ?? null,
        paymentLinkStatus: p.paymentLinkStatus
          ? (p.paymentLinkStatus as PrismaLinkStatus)
          : null,
        tefTransactionId: p.tefTransactionId ?? null,
        notes: p.notes ?? null,
      })),
    });
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<PosTransactionPayment[]> {
    const data = await prisma.posTransactionPayment.findMany({
      where: { transactionId },
    });
    return data.map(posTransactionPaymentPrismaToDomain);
  }
}
