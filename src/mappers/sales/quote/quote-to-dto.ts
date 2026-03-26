import type { Quote } from '@/entities/sales/quote';

export interface QuoteItemDTO {
  id: string;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface QuoteDTO {
  id: string;
  tenantId: string;
  customerId: string;
  title: string;
  status: string;
  validUntil?: Date;
  notes?: string;
  subtotal: number;
  discount: number;
  total: number;
  sentAt?: Date;
  viewedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  items: QuoteItemDTO[];
}

export function quoteToDTO(quote: Quote): QuoteDTO {
  const dto: QuoteDTO = {
    id: quote.id.toString(),
    tenantId: quote.tenantId.toString(),
    customerId: quote.customerId.toString(),
    title: quote.title,
    status: quote.status,
    subtotal: quote.subtotal,
    discount: quote.discount,
    total: quote.total,
    viewCount: quote.viewCount,
    createdBy: quote.createdBy,
    isActive: quote.isActive,
    createdAt: quote.createdAt,
    items: quote.items.map((quoteItem) => ({
      id: quoteItem.id.toString(),
      variantId: quoteItem.variantId,
      productName: quoteItem.productName,
      quantity: quoteItem.quantity,
      unitPrice: quoteItem.unitPrice,
      discount: quoteItem.discount,
      total: quoteItem.total,
    })),
  };

  if (quote.validUntil) dto.validUntil = quote.validUntil;
  if (quote.notes) dto.notes = quote.notes;
  if (quote.sentAt) dto.sentAt = quote.sentAt;
  if (quote.viewedAt) dto.viewedAt = quote.viewedAt;
  if (quote.lastViewedAt) dto.lastViewedAt = quote.lastViewedAt;
  if (quote.updatedAt) dto.updatedAt = quote.updatedAt;
  if (quote.deletedAt) dto.deletedAt = quote.deletedAt;

  return dto;
}
