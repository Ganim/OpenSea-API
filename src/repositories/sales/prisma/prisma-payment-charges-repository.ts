import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PaymentChargeStatus } from '@/entities/sales/payment-charge';
import { PaymentCharge } from '@/entities/sales/payment-charge';
import type { PosPaymentMethod } from '@/entities/sales/pos-transaction-payment';
import { prisma } from '@/lib/prisma';
import type {
  PaymentChargeStatus as PrismaPaymentChargeStatus,
  PosPaymentMethod as PrismaPosPaymentMethod,
} from '@prisma/generated/client.js';
import type {
  CreatePaymentChargeSchema,
  PaymentChargesRepository,
} from '../payment-charges-repository';

function mapToDomain(data: Record<string, unknown>): PaymentCharge {
  return PaymentCharge.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      orderId: new UniqueEntityID(data.orderId as string),
      transactionPaymentId: data.transactionPaymentId
        ? new UniqueEntityID(data.transactionPaymentId as string)
        : undefined,
      provider: data.provider as string,
      providerChargeId: (data.providerChargeId as string) ?? undefined,
      method: data.method as PosPaymentMethod,
      amount: Number(data.amount),
      status: data.status as PaymentChargeStatus,
      qrCode: (data.qrCode as string) ?? undefined,
      checkoutUrl: (data.checkoutUrl as string) ?? undefined,
      boletoUrl: (data.boletoUrl as string) ?? undefined,
      boletoBarcode: (data.boletoBarcode as string) ?? undefined,
      paidAt: (data.paidAt as Date) ?? undefined,
      paidAmount: data.paidAmount ? Number(data.paidAmount) : undefined,
      expiresAt: (data.expiresAt as Date) ?? undefined,
      rawResponse: data.rawResponse ?? undefined,
      webhookData: data.webhookData ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaPaymentChargesRepository
  implements PaymentChargesRepository
{
  async create(data: CreatePaymentChargeSchema): Promise<PaymentCharge> {
    const chargeData = await prisma.paymentCharge.create({
      data: {
        tenantId: data.tenantId,
        orderId: data.orderId,
        provider: data.provider,
        providerChargeId: data.providerChargeId,
        method: data.method as PrismaPosPaymentMethod,
        amount: data.amount,
        status: (data.status ?? 'PENDING') as PrismaPaymentChargeStatus,
        qrCode: data.qrCode,
        checkoutUrl: data.checkoutUrl,
        boletoUrl: data.boletoUrl,
        boletoBarcode: data.boletoBarcode,
        paidAt: data.paidAt,
        paidAmount: data.paidAmount,
        expiresAt: data.expiresAt,
        rawResponse: data.rawResponse
          ? (data.rawResponse as Record<string, unknown>)
          : undefined,
      },
    });

    return mapToDomain(chargeData as unknown as Record<string, unknown>);
  }

  async findById(id: string, tenantId: string): Promise<PaymentCharge | null> {
    const chargeData = await prisma.paymentCharge.findFirst({
      where: { id, tenantId },
    });

    if (!chargeData) return null;

    return mapToDomain(chargeData as unknown as Record<string, unknown>);
  }

  async findByOrder(
    orderId: string,
    tenantId: string,
  ): Promise<PaymentCharge[]> {
    const chargesData = await prisma.paymentCharge.findMany({
      where: {
        orderId,
        tenantId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return chargesData.map((chargeData) =>
      mapToDomain(chargeData as unknown as Record<string, unknown>),
    );
  }

  async findByProviderChargeId(
    providerChargeId: string,
  ): Promise<PaymentCharge | null> {
    const chargeData = await prisma.paymentCharge.findFirst({
      where: { providerChargeId },
    });

    if (!chargeData) return null;

    return mapToDomain(chargeData as unknown as Record<string, unknown>);
  }

  async findPendingByOrder(
    orderId: string,
    tenantId: string,
  ): Promise<PaymentCharge[]> {
    const chargesData = await prisma.paymentCharge.findMany({
      where: {
        orderId,
        tenantId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    return chargesData.map((chargeData) =>
      mapToDomain(chargeData as unknown as Record<string, unknown>),
    );
  }

  async findPendingOverAge(
    tenantId: string,
    ageHours = 24,
  ): Promise<PaymentCharge[]> {
    const thresholdDate = new Date(Date.now() - ageHours * 60 * 60 * 1000);

    const chargesData = await prisma.paymentCharge.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        createdAt: {
          lt: thresholdDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return chargesData.map((chargeData) =>
      mapToDomain(chargeData as unknown as Record<string, unknown>),
    );
  }

  async updateStatusIdempotent(
    id: string,
    newStatus: PaymentChargeStatus,
    paidAmount?: number,
    paidAt?: Date,
    webhookData?: unknown,
  ): Promise<number> {
    const result = await prisma.paymentCharge.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: newStatus as PrismaPaymentChargeStatus,
        ...(paidAmount !== undefined && { paidAmount }),
        ...(paidAt && { paidAt }),
        ...(webhookData && {
          webhookData: webhookData as Record<string, unknown>,
        }),
      },
    });

    return result.count;
  }

  async save(charge: PaymentCharge): Promise<void> {
    await prisma.paymentCharge.update({
      where: { id: charge.id.toString() },
      data: {
        status: charge.status as PrismaPaymentChargeStatus,
        providerChargeId: charge.providerChargeId,
        qrCode: charge.qrCode,
        checkoutUrl: charge.checkoutUrl,
        boletoUrl: charge.boletoUrl,
        boletoBarcode: charge.boletoBarcode,
        paidAt: charge.paidAt,
        paidAmount: charge.paidAmount,
        expiresAt: charge.expiresAt,
        rawResponse: charge.rawResponse
          ? (charge.rawResponse as Record<string, unknown>)
          : undefined,
        webhookData: charge.webhookData
          ? (charge.webhookData as Record<string, unknown>)
          : undefined,
        transactionPaymentId: charge.transactionPaymentId?.toString(),
      },
    });
  }
}
