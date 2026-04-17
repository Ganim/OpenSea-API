import { randomUUID } from 'node:crypto';
import type {
  CreatePaymentOrderData,
  PaymentOrderRecord,
  PaymentOrdersRepository,
  UpdatePaymentOrderData,
} from '../payment-orders-repository';
import type { PaymentOrderStatus } from '@prisma/generated/client.js';

export class InMemoryPaymentOrdersRepository
  implements PaymentOrdersRepository
{
  public items: PaymentOrderRecord[] = [];

  async create(data: CreatePaymentOrderData): Promise<PaymentOrderRecord> {
    const now = new Date();
    const record: PaymentOrderRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      entryId: data.entryId,
      bankAccountId: data.bankAccountId,
      method: data.method,
      amount: data.amount,
      recipientData: data.recipientData,
      status: 'PENDING_APPROVAL' as PaymentOrderStatus,
      requestedById: data.requestedById,
      approvedById: null,
      approvedAt: null,
      rejectedReason: null,
      externalId: null,
      receiptData: null,
      receiptFileId: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(record);
    return record;
  }

  async findById(
    id: { toString(): string },
    tenantId: string,
  ): Promise<PaymentOrderRecord | null> {
    return (
      this.items.find(
        (item) => item.id === id.toString() && item.tenantId === tenantId,
      ) ?? null
    );
  }

  async findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<PaymentOrderRecord[]> {
    return this.items.filter(
      (item) => item.entryId === entryId && item.tenantId === tenantId,
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
    let filtered = this.items.filter((item) => item.tenantId === tenantId);

    if (options?.status) {
      filtered = filtered.filter((item) => item.status === options.status);
    }

    const total = filtered.length;
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const start = (page - 1) * limit;
    const orders = filtered.slice(start, start + limit);

    return { orders, total };
  }

  async update(
    data: UpdatePaymentOrderData,
  ): Promise<PaymentOrderRecord | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id === data.id.toString() && item.tenantId === data.tenantId,
    );

    if (index === -1) return null;

    const existing = this.items[index];

    // CAS guard: bail out if the caller expected a different status.
    if (
      data.expectedStatus !== undefined &&
      existing.status !== data.expectedStatus
    ) {
      return null;
    }

    const updated: PaymentOrderRecord = {
      ...existing,
      status: data.status ?? existing.status,
      approvedById: data.approvedById ?? existing.approvedById,
      approvedAt: data.approvedAt ?? existing.approvedAt,
      rejectedReason: data.rejectedReason ?? existing.rejectedReason,
      externalId: data.externalId ?? existing.externalId,
      receiptData: data.receiptData ?? existing.receiptData,
      receiptFileId: data.receiptFileId ?? existing.receiptFileId,
      errorMessage: data.errorMessage ?? existing.errorMessage,
      updatedAt: new Date(),
    };

    this.items[index] = updated;
    return updated;
  }
}
