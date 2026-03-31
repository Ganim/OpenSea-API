export interface BankWebhookEventRecord {
  id: string;
  tenantId: string;
  bankAccountId: string;
  provider: string;
  eventType: string;
  externalId: string;
  amount: number;
  payload: Record<string, unknown>;
  matchedEntryId: string | null;
  autoSettled: boolean;
  processedAt: Date | null;
  createdAt: Date;
}

export interface CreateBankWebhookEventData {
  tenantId: string;
  bankAccountId: string;
  provider: string;
  eventType: string;
  externalId: string;
  amount: number;
  payload: Record<string, unknown>;
  matchedEntryId?: string;
  autoSettled?: boolean;
  processedAt?: Date;
}

export interface BankWebhookEventsRepository {
  create(data: CreateBankWebhookEventData): Promise<BankWebhookEventRecord>;
  findByExternalId(
    externalId: string,
    tenantId: string,
  ): Promise<BankWebhookEventRecord | null>;
  findMany(
    tenantId: string,
    options?: {
      bankAccountId?: string;
      autoSettled?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{ events: BankWebhookEventRecord[]; total: number }>;
}
