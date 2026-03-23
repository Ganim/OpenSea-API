import type { MarketplaceOrder } from '@/entities/sales/marketplace-order';

export interface MarketplaceOrderDTO {
  id: string;
  connectionId: string;
  externalOrderId: string;
  externalOrderUrl?: string;
  status: string;
  marketplaceStatus?: string;
  buyerName: string;
  buyerDocument?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  customerId?: string;
  subtotal: number;
  shippingCost: number;
  marketplaceFee: number;
  netAmount: number;
  currency: string;
  shippingMethod?: string;
  trackingCode?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  deliveryAddress: Record<string, unknown>;
  orderId?: string;
  notes?: string;
  receivedAt: Date;
  acknowledgedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export function marketplaceOrderToDTO(
  order: MarketplaceOrder,
): MarketplaceOrderDTO {
  return {
    id: order.id.toString(),
    connectionId: order.connectionId.toString(),
    externalOrderId: order.externalOrderId,
    externalOrderUrl: order.externalOrderUrl,
    status: order.status,
    marketplaceStatus: order.marketplaceStatus,
    buyerName: order.buyerName,
    buyerDocument: order.buyerDocument,
    buyerEmail: order.buyerEmail,
    buyerPhone: order.buyerPhone,
    customerId: order.customerId,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    marketplaceFee: order.marketplaceFee,
    netAmount: order.netAmount,
    currency: order.currency,
    shippingMethod: order.shippingMethod,
    trackingCode: order.trackingCode,
    trackingUrl: order.trackingUrl,
    estimatedDelivery: order.estimatedDelivery,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    deliveryAddress: order.deliveryAddress,
    orderId: order.orderId,
    notes: order.notes,
    receivedAt: order.receivedAt,
    acknowledgedAt: order.acknowledgedAt,
    processedAt: order.processedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
