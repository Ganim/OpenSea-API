import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface PaymentLinkRecord {
  id: string;
  tenantId: string;
  entryId: string | null;
  slug: string;
  amount: number;
  description: string;
  customerName: string | null;
  expiresAt: Date | null;
  pixCopiaECola: string | null;
  boletoDigitableLine: string | null;
  boletoPdfUrl: string | null;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}

export interface CreatePaymentLinkSchema {
  tenantId: string;
  entryId?: string;
  slug: string;
  amount: number;
  description: string;
  customerName?: string;
  expiresAt?: Date;
  pixCopiaECola?: string;
  boletoDigitableLine?: string;
  boletoPdfUrl?: string;
}

export interface UpdatePaymentLinkSchema {
  id: UniqueEntityID;
  tenantId: string;
  status?: string;
  paidAt?: Date;
  pixCopiaECola?: string;
  boletoDigitableLine?: string;
  boletoPdfUrl?: string;
}

export interface PaymentLinksRepository {
  create(data: CreatePaymentLinkSchema): Promise<PaymentLinkRecord>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PaymentLinkRecord | null>;
  findBySlug(slug: string): Promise<PaymentLinkRecord | null>;
  findMany(
    tenantId: string,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<{ links: PaymentLinkRecord[]; total: number }>;
  update(data: UpdatePaymentLinkSchema): Promise<PaymentLinkRecord | null>;
}
