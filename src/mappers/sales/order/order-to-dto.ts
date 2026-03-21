import type { Order } from '@/entities/sales/order';

export interface OrderDTO {
  id: string;
  tenantId: string;
  orderNumber: string;
  type: string;
  customerId: string;
  contactId: string | null;
  pipelineId: string;
  stageId: string;
  channel: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  priceTableId: string | null;
  paymentConditionId: string | null;
  creditUsed: number;
  paidAmount: number;
  remainingAmount: number;
  deliveryMethod: string | null;
  needsApproval: boolean;
  assignedToUserId: string | null;
  notes: string | null;
  internalNotes: string | null;
  tags: string[];
  stageEnteredAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function orderToDTO(order: Order): OrderDTO {
  return {
    id: order.id.toString(),
    tenantId: order.tenantId.toString(),
    orderNumber: order.orderNumber,
    type: order.type,
    customerId: order.customerId.toString(),
    contactId: order.contactId?.toString() ?? null,
    pipelineId: order.pipelineId.toString(),
    stageId: order.stageId.toString(),
    channel: order.channel,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    taxTotal: order.taxTotal,
    shippingTotal: order.shippingTotal,
    grandTotal: order.grandTotal,
    currency: order.currency,
    priceTableId: order.priceTableId?.toString() ?? null,
    paymentConditionId: order.paymentConditionId?.toString() ?? null,
    creditUsed: order.creditUsed,
    paidAmount: order.paidAmount,
    remainingAmount: order.remainingAmount,
    deliveryMethod: order.deliveryMethod ?? null,
    needsApproval: order.needsApproval,
    assignedToUserId: order.assignedToUserId?.toString() ?? null,
    notes: order.notes ?? null,
    internalNotes: order.internalNotes ?? null,
    tags: order.tags,
    stageEnteredAt: order.stageEnteredAt,
    confirmedAt: order.confirmedAt ?? null,
    cancelledAt: order.cancelledAt ?? null,
    cancelReason: order.cancelReason ?? null,
    expiresAt: order.expiresAt ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? null,
  };
}
