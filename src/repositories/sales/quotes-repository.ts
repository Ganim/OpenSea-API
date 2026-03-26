import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Quote, QuoteStatus } from '@/entities/sales/quote';

export interface CreateQuoteItemSchema {
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface CreateQuoteSchema {
  tenantId: string;
  customerId: string;
  title: string;
  validUntil?: Date;
  notes?: string;
  subtotal: number;
  discount: number;
  total: number;
  createdBy: string;
  items: CreateQuoteItemSchema[];
}

export interface UpdateQuoteSchema {
  id: UniqueEntityID;
  tenantId: string;
  customerId?: string;
  title?: string;
  validUntil?: Date | null;
  notes?: string | null;
  discount?: number;
  items?: CreateQuoteItemSchema[];
}

export interface QuotesRepository {
  create(data: CreateQuoteSchema): Promise<Quote>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Quote | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { status?: QuoteStatus; customerId?: string },
  ): Promise<Quote[]>;
  countMany(
    tenantId: string,
    filters?: { status?: QuoteStatus; customerId?: string },
  ): Promise<number>;
  save(quote: Quote): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
