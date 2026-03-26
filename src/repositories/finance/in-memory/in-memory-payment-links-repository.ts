import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { randomUUID } from 'node:crypto';
import type {
  CreatePaymentLinkSchema,
  PaymentLinkRecord,
  PaymentLinksRepository,
  UpdatePaymentLinkSchema,
} from '../payment-links-repository';

export class InMemoryPaymentLinksRepository implements PaymentLinksRepository {
  public items: PaymentLinkRecord[] = [];

  async create(data: CreatePaymentLinkSchema): Promise<PaymentLinkRecord> {
    const record: PaymentLinkRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      entryId: data.entryId ?? null,
      slug: data.slug,
      amount: data.amount,
      description: data.description,
      customerName: data.customerName ?? null,
      expiresAt: data.expiresAt ?? null,
      pixCopiaECola: data.pixCopiaECola ?? null,
      boletoDigitableLine: data.boletoDigitableLine ?? null,
      boletoPdfUrl: data.boletoPdfUrl ?? null,
      status: 'ACTIVE',
      paidAt: null,
      createdAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PaymentLinkRecord | null> {
    return (
      this.items.find(
        (item) => item.id === id.toString() && item.tenantId === tenantId,
      ) ?? null
    );
  }

  async findBySlug(slug: string): Promise<PaymentLinkRecord | null> {
    return this.items.find((item) => item.slug === slug) ?? null;
  }

  async findMany(
    tenantId: string,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<{ links: PaymentLinkRecord[]; total: number }> {
    let filtered = this.items.filter((item) => item.tenantId === tenantId);

    if (options?.status) {
      filtered = filtered.filter((item) => item.status === options.status);
    }

    const total = filtered.length;
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const start = (page - 1) * limit;
    const links = filtered.slice(start, start + limit);

    return { links, total };
  }

  async update(
    data: UpdatePaymentLinkSchema,
  ): Promise<PaymentLinkRecord | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id === data.id.toString() && item.tenantId === data.tenantId,
    );

    if (index === -1) return null;

    const existing = this.items[index];
    const updated: PaymentLinkRecord = {
      ...existing,
      status: data.status ?? existing.status,
      paidAt: data.paidAt ?? existing.paidAt,
      pixCopiaECola: data.pixCopiaECola ?? existing.pixCopiaECola,
      boletoDigitableLine:
        data.boletoDigitableLine ?? existing.boletoDigitableLine,
      boletoPdfUrl: data.boletoPdfUrl ?? existing.boletoPdfUrl,
    };

    this.items[index] = updated;
    return updated;
  }
}
