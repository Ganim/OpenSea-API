import { prisma } from '@/lib/prisma';
import type {
  CreatePaymentOrderData,
  PaymentOrderRecord,
  PaymentOrdersRepository,
  UpdatePaymentOrderData,
} from '../payment-orders-repository';
import { Prisma, type PaymentOrderStatus } from '@prisma/generated/client.js';

function toPersisted(raw: Record<string, unknown>): PaymentOrderRecord {
  return {
    id: raw.id as string,
    tenantId: raw.tenantId as string,
    entryId: raw.entryId as string,
    bankAccountId: raw.bankAccountId as string,
    method: raw.method as PaymentOrderRecord['method'],
    amount: Number(raw.amount),
    recipientData: (raw.recipientData as Record<string, unknown>) ?? {},
    status: raw.status as PaymentOrderRecord['status'],
    requestedById: raw.requestedById as string,
    approvedById: (raw.approvedById as string) ?? null,
    approvedAt: (raw.approvedAt as Date) ?? null,
    rejectedReason: (raw.rejectedReason as string) ?? null,
    externalId: (raw.externalId as string) ?? null,
    receiptData: (raw.receiptData as Record<string, unknown>) ?? null,
    receiptFileId: (raw.receiptFileId as string) ?? null,
    errorMessage: (raw.errorMessage as string) ?? null,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
}

export class PrismaPaymentOrdersRepository implements PaymentOrdersRepository {
  async create(data: CreatePaymentOrderData): Promise<PaymentOrderRecord> {
    const record = await prisma.paymentOrder.create({
      data: {
        tenantId: data.tenantId,
        entryId: data.entryId,
        bankAccountId: data.bankAccountId,
        method: data.method,
        amount: data.amount,
        recipientData: data.recipientData as Prisma.InputJsonValue,
        requestedById: data.requestedById,
      },
    });

    return toPersisted(record as unknown as Record<string, unknown>);
  }

  async findById(
    id: { toString(): string },
    tenantId: string,
  ): Promise<PaymentOrderRecord | null> {
    const record = await prisma.paymentOrder.findFirst({
      where: { id: id.toString(), tenantId },
    });

    return record
      ? toPersisted(record as unknown as Record<string, unknown>)
      : null;
  }

  async findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<PaymentOrderRecord[]> {
    const records = await prisma.paymentOrder.findMany({
      where: { entryId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) =>
      toPersisted(r as unknown as Record<string, unknown>),
    );
  }

  async findMany(
    tenantId: string,
    options?: {
      status?: PaymentOrderStatus;
      page?: number;
      limit?: number;
    },
  ): Promise<{ orders: PaymentOrderRecord[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    const where: Record<string, unknown> = { tenantId };
    if (options?.status) where.status = options.status;

    const [records, total] = await Promise.all([
      prisma.paymentOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentOrder.count({ where }),
    ]);

    return {
      orders: records.map((r) =>
        toPersisted(r as unknown as Record<string, unknown>),
      ),
      total,
    };
  }

  async update(
    data: UpdatePaymentOrderData,
  ): Promise<PaymentOrderRecord | null> {
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.approvedById !== undefined)
      updateData.approvedById = data.approvedById;
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;
    if (data.rejectedReason !== undefined)
      updateData.rejectedReason = data.rejectedReason;
    if (data.externalId !== undefined) updateData.externalId = data.externalId;
    if (data.receiptData !== undefined)
      updateData.receiptData = data.receiptData;
    if (data.receiptFileId !== undefined)
      updateData.receiptFileId = data.receiptFileId;
    if (data.errorMessage !== undefined)
      updateData.errorMessage = data.errorMessage;

    // Scope update by tenantId for multi-tenant safety
    const exists = await prisma.paymentOrder.findFirst({
      where: { id: data.id.toString(), tenantId: data.tenantId },
    });
    if (!exists) return null;

    const record = await prisma.paymentOrder.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toPersisted(record as unknown as Record<string, unknown>);
  }
}
