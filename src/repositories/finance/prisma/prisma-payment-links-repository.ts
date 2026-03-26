import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreatePaymentLinkSchema,
  PaymentLinkRecord,
  PaymentLinksRepository,
  UpdatePaymentLinkSchema,
} from '../payment-links-repository';

function toPersisted(raw: Record<string, unknown>): PaymentLinkRecord {
  return {
    id: raw.id as string,
    tenantId: raw.tenantId as string,
    entryId: (raw.entryId as string) ?? null,
    slug: raw.slug as string,
    amount: Number(raw.amount),
    description: raw.description as string,
    customerName: (raw.customerName as string) ?? null,
    expiresAt: (raw.expiresAt as Date) ?? null,
    pixCopiaECola: (raw.pixCopiaECola as string) ?? null,
    boletoDigitableLine: (raw.boletoDigitableLine as string) ?? null,
    boletoPdfUrl: (raw.boletoPdfUrl as string) ?? null,
    status: raw.status as string,
    paidAt: (raw.paidAt as Date) ?? null,
    createdAt: raw.createdAt as Date,
  };
}

export class PrismaPaymentLinksRepository implements PaymentLinksRepository {
  async create(data: CreatePaymentLinkSchema): Promise<PaymentLinkRecord> {
    const record = await prisma.paymentLink.create({
      data: {
        tenantId: data.tenantId,
        entryId: data.entryId,
        slug: data.slug,
        amount: data.amount,
        description: data.description,
        customerName: data.customerName,
        expiresAt: data.expiresAt,
        pixCopiaECola: data.pixCopiaECola,
        boletoDigitableLine: data.boletoDigitableLine,
        boletoPdfUrl: data.boletoPdfUrl,
      },
    });

    return toPersisted(record as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PaymentLinkRecord | null> {
    const record = await prisma.paymentLink.findFirst({
      where: { id: id.toString(), tenantId },
    });

    return record
      ? toPersisted(record as unknown as Record<string, unknown>)
      : null;
  }

  async findBySlug(slug: string): Promise<PaymentLinkRecord | null> {
    const record = await prisma.paymentLink.findUnique({
      where: { slug },
    });

    return record
      ? toPersisted(record as unknown as Record<string, unknown>)
      : null;
  }

  async findMany(
    tenantId: string,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<{ links: PaymentLinkRecord[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    const where: Record<string, unknown> = { tenantId };
    if (options?.status) where.status = options.status;

    const [records, total] = await Promise.all([
      prisma.paymentLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentLink.count({ where }),
    ]);

    return {
      links: records.map((r) =>
        toPersisted(r as unknown as Record<string, unknown>),
      ),
      total,
    };
  }

  async update(
    data: UpdatePaymentLinkSchema,
  ): Promise<PaymentLinkRecord | null> {
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt;
    if (data.pixCopiaECola !== undefined)
      updateData.pixCopiaECola = data.pixCopiaECola;
    if (data.boletoDigitableLine !== undefined)
      updateData.boletoDigitableLine = data.boletoDigitableLine;
    if (data.boletoPdfUrl !== undefined)
      updateData.boletoPdfUrl = data.boletoPdfUrl;

    const record = await prisma.paymentLink.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toPersisted(record as unknown as Record<string, unknown>);
  }
}
