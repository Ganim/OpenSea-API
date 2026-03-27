import { randomUUID } from 'node:crypto';
import type {
  CreateFinanceEntryRetentionSchema,
  FinanceEntryRetentionRecord,
  FinanceEntryRetentionsRepository,
} from '../finance-entry-retentions-repository';

export class InMemoryFinanceEntryRetentionsRepository
  implements FinanceEntryRetentionsRepository
{
  public items: FinanceEntryRetentionRecord[] = [];

  async createMany(
    data: CreateFinanceEntryRetentionSchema[],
  ): Promise<FinanceEntryRetentionRecord[]> {
    const records: FinanceEntryRetentionRecord[] = data.map((item) => ({
      id: randomUUID(),
      tenantId: item.tenantId,
      entryId: item.entryId,
      taxType: item.taxType,
      grossAmount: item.grossAmount,
      rate: item.rate,
      amount: item.amount,
      withheld: item.withheld ?? true,
      description: item.description ?? null,
      createdAt: new Date(),
    }));

    this.items.push(...records);
    return records;
  }

  async findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<FinanceEntryRetentionRecord[]> {
    return this.items.filter(
      (r) => r.entryId === entryId && r.tenantId === tenantId,
    );
  }

  async findByEntryIds(
    entryIds: string[],
    tenantId: string,
  ): Promise<FinanceEntryRetentionRecord[]> {
    return this.items.filter(
      (r) => entryIds.includes(r.entryId) && r.tenantId === tenantId,
    );
  }

  async deleteByEntryId(entryId: string, tenantId: string): Promise<number> {
    const before = this.items.length;
    this.items = this.items.filter(
      (r) => !(r.entryId === entryId && r.tenantId === tenantId),
    );
    return before - this.items.length;
  }
}
