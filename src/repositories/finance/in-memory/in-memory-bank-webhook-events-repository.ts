import { randomUUID } from 'node:crypto';
import type {
  BankWebhookEventRecord,
  BankWebhookEventsRepository,
  CreateBankWebhookEventData,
} from '../bank-webhook-events-repository';

export class InMemoryBankWebhookEventsRepository
  implements BankWebhookEventsRepository
{
  public items: BankWebhookEventRecord[] = [];

  async create(
    data: CreateBankWebhookEventData,
  ): Promise<BankWebhookEventRecord> {
    const record: BankWebhookEventRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      bankAccountId: data.bankAccountId,
      provider: data.provider,
      eventType: data.eventType,
      externalId: data.externalId,
      amount: data.amount,
      payload: data.payload,
      matchedEntryId: data.matchedEntryId ?? null,
      autoSettled: data.autoSettled ?? false,
      processedAt: data.processedAt ?? null,
      createdAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findByExternalId(
    externalId: string,
    tenantId: string,
  ): Promise<BankWebhookEventRecord | null> {
    return (
      this.items.find(
        (item) => item.externalId === externalId && item.tenantId === tenantId,
      ) ?? null
    );
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
    let filtered = this.items.filter((item) => item.tenantId === tenantId);

    if (options?.bankAccountId !== undefined) {
      filtered = filtered.filter(
        (item) => item.bankAccountId === options.bankAccountId,
      );
    }

    if (options?.autoSettled !== undefined) {
      filtered = filtered.filter(
        (item) => item.autoSettled === options.autoSettled,
      );
    }

    const total = filtered.length;
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const start = (page - 1) * limit;
    const events = filtered.slice(start, start + limit);

    return { events, total };
  }
}
