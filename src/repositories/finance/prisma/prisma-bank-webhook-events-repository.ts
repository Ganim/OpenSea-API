import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/generated/client.js';
import type {
  BankWebhookEventRecord,
  BankWebhookEventsRepository,
  CreateBankWebhookEventData,
} from '../bank-webhook-events-repository';

function toPersisted(raw: Record<string, unknown>): BankWebhookEventRecord {
  return {
    id: raw.id as string,
    tenantId: raw.tenantId as string,
    bankAccountId: raw.bankAccountId as string,
    provider: raw.provider as string,
    eventType: raw.eventType as string,
    externalId: raw.externalId as string,
    amount: Number(raw.amount),
    payload: (raw.payload as Record<string, unknown>) ?? {},
    matchedEntryId: (raw.matchedEntryId as string) ?? null,
    autoSettled: raw.autoSettled as boolean,
    processedAt: (raw.processedAt as Date) ?? null,
    createdAt: raw.createdAt as Date,
  };
}

export class PrismaBankWebhookEventsRepository
  implements BankWebhookEventsRepository
{
  async create(
    data: CreateBankWebhookEventData,
  ): Promise<BankWebhookEventRecord> {
    const record = await prisma.bankWebhookEvent.create({
      data: {
        tenantId: data.tenantId,
        bankAccountId: data.bankAccountId,
        provider: data.provider,
        eventType: data.eventType,
        externalId: data.externalId,
        amount: data.amount,
        payload: data.payload as Prisma.InputJsonValue,
        matchedEntryId: data.matchedEntryId,
        autoSettled: data.autoSettled ?? false,
        processedAt: data.processedAt,
      },
    });

    return toPersisted(record as unknown as Record<string, unknown>);
  }

  async findByExternalId(
    externalId: string,
    tenantId: string,
  ): Promise<BankWebhookEventRecord | null> {
    const record = await prisma.bankWebhookEvent.findFirst({
      where: { externalId, tenantId },
    });

    return record
      ? toPersisted(record as unknown as Record<string, unknown>)
      : null;
  }

  async findMany(
    tenantId: string,
    options?: {
      bankAccountId?: string;
      autoSettled?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{ events: BankWebhookEventRecord[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    const where: Record<string, unknown> = { tenantId };
    if (options?.bankAccountId !== undefined)
      where.bankAccountId = options.bankAccountId;
    if (options?.autoSettled !== undefined)
      where.autoSettled = options.autoSettled;

    const [records, total] = await Promise.all([
      prisma.bankWebhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bankWebhookEvent.count({ where }),
    ]);

    return {
      events: records.map((r) =>
        toPersisted(r as unknown as Record<string, unknown>),
      ),
      total,
    };
  }
}
