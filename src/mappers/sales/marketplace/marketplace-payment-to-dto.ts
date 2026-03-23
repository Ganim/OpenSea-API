import type { MarketplacePayment } from '@/entities/sales/marketplace-payment';

export interface MarketplacePaymentDTO {
  id: string;
  connectionId: string;
  externalPaymentId?: string;
  type: string;
  description?: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  marketplaceOrderId?: string;
  installmentNumber?: number;
  settlementDate?: Date;
  status: string;
  financeEntryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export function marketplacePaymentToDTO(
  payment: MarketplacePayment,
): MarketplacePaymentDTO {
  return {
    id: payment.id.toString(),
    connectionId: payment.connectionId.toString(),
    externalPaymentId: payment.externalPaymentId,
    type: payment.type,
    description: payment.description,
    grossAmount: payment.grossAmount,
    feeAmount: payment.feeAmount,
    netAmount: payment.netAmount,
    currency: payment.currency,
    marketplaceOrderId: payment.marketplaceOrderId,
    installmentNumber: payment.installmentNumber,
    settlementDate: payment.settlementDate,
    status: payment.status,
    financeEntryId: payment.financeEntryId,
    metadata: payment.metadata,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
