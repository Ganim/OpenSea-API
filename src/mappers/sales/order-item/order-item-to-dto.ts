import type { OrderItem } from '@/entities/sales/order-item';

export interface OrderItemDTO {
  id: string;
  orderId: string;
  variantId: string | null;
  comboId: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountValue: number;
  subtotal: number;
  taxTotal: number;
  quantityDelivered: number;
  quantityReturned: number;
  priceSource: string;
  position: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function orderItemToDTO(item: OrderItem): OrderItemDTO {
  return {
    id: item.id.toString(),
    orderId: item.orderId.toString(),
    variantId: item.variantId?.toString() ?? null,
    comboId: item.comboId?.toString() ?? null,
    name: item.name,
    sku: item.sku ?? null,
    description: item.description ?? null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountPercent: item.discountPercent,
    discountValue: item.discountValue,
    subtotal: item.subtotal,
    taxTotal: item.taxTotal,
    quantityDelivered: item.quantityDelivered,
    quantityReturned: item.quantityReturned,
    priceSource: item.priceSource,
    position: item.position,
    notes: item.notes ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? null,
  };
}
