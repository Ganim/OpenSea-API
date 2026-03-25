import { PixCharge, type PixChargeStatus } from '@/entities/cashier/pix-charge';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import type { PixChargesRepository } from '../pix-charges-repository';

function toDomain(raw: Record<string, unknown>): PixCharge {
  const amount =
    raw.amount instanceof Prisma.Decimal
      ? raw.amount.toNumber()
      : (raw.amount as number);

  return PixCharge.create(
    {
      id: new UniqueEntityID(raw.id as string),
      tenantId: raw.tenantId as string,
      txId: raw.txId as string,
      location: (raw.location as string) ?? '',
      pixCopiaECola: (raw.pixCopiaECola as string) ?? '',
      amount,
      status: raw.status as PixChargeStatus,
      payerName: (raw.payerName as string) ?? null,
      payerCpfCnpj: (raw.payerCpfCnpj as string) ?? null,
      endToEndId: (raw.endToEndId as string) ?? null,
      posTransactionPaymentId: (raw.posTransactionPaymentId as string) ?? null,
      orderId: (raw.orderId as string) ?? null,
      expiresAt: raw.expiresAt as Date,
      paidAt: (raw.paidAt as Date) ?? null,
      provider: raw.provider as string,
      providerData: (raw.providerData as Record<string, unknown>) ?? null,
      createdAt: raw.createdAt as Date,
      updatedAt: (raw.updatedAt as Date) ?? null,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaPixChargesRepository implements PixChargesRepository {
  async findById(id: string): Promise<PixCharge | null> {
    const chargeRecord = await prisma.pixCharge.findUnique({
      where: { id },
    });

    return chargeRecord
      ? toDomain(chargeRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByTxId(txId: string): Promise<PixCharge | null> {
    const chargeRecord = await prisma.pixCharge.findUnique({
      where: { txId },
    });

    return chargeRecord
      ? toDomain(chargeRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByTenantId(
    tenantId: string,
    params: { page: number; limit: number; status?: string },
  ): Promise<{ charges: PixCharge[]; total: number }> {
    const { page, limit, status } = params;

    const where: Prisma.PixChargeWhereInput = { tenantId };

    if (status) {
      where.status = status;
    }

    const [chargeRecords, total] = await Promise.all([
      prisma.pixCharge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pixCharge.count({ where }),
    ]);

    const charges = chargeRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );

    return { charges, total };
  }

  async create(charge: PixCharge): Promise<void> {
    await prisma.pixCharge.create({
      data: {
        id: charge.pixChargeId.toString(),
        tenantId: charge.tenantId,
        txId: charge.txId,
        location: charge.location || null,
        pixCopiaECola: charge.pixCopiaECola || null,
        amount: charge.amount,
        status: charge.status,
        payerName: charge.payerName,
        payerCpfCnpj: charge.payerCpfCnpj,
        endToEndId: charge.endToEndId,
        posTransactionPaymentId: charge.posTransactionPaymentId,
        orderId: charge.orderId,
        expiresAt: charge.expiresAt,
        paidAt: charge.paidAt,
        provider: charge.provider,
        providerData:
          (charge.providerData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        createdAt: charge.createdAt,
      },
    });
  }

  async save(charge: PixCharge): Promise<void> {
    await prisma.pixCharge.update({
      where: { id: charge.pixChargeId.toString() },
      data: {
        status: charge.status,
        payerName: charge.payerName,
        payerCpfCnpj: charge.payerCpfCnpj,
        endToEndId: charge.endToEndId,
        paidAt: charge.paidAt,
        providerData:
          (charge.providerData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }
}
