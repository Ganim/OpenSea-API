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
  tags: string[];
  stageEnteredAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  expiresAt: Date | null;
  // Fase 1 (Emporion) — origin + ack + fiscal
  originSource: 'WEB' | 'POS_DESKTOP' | 'API' | 'MOBILE';
  posTerminalId: string | null;
  posSessionId: string | null;
  posOperatorEmployeeId: string | null;
  saleLocalUuid: string | null;
  ackReceivedAt: Date | null;
  fiscalDocumentType: 'NFE' | 'NFC_E' | 'SAT_CFE' | 'MFE' | null;
  fiscalDocumentNumber: number | null;
  fiscalAccessKey: string | null;
  fiscalAuthorizationProtocol: string | null;
  fiscalEmittedAt: Date | null;
  fiscalEmissionStatus: string | null;
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
    tags: order.tags,
    stageEnteredAt: order.stageEnteredAt,
    confirmedAt: order.confirmedAt ?? null,
    cancelledAt: order.cancelledAt ?? null,
    cancelReason: order.cancelReason ?? null,
    expiresAt: order.expiresAt ?? null,
    originSource: order.originSource.value,
    posTerminalId: order.posTerminalId ?? null,
    posSessionId: order.posSessionId?.toString() ?? null,
    posOperatorEmployeeId: order.posOperatorEmployeeId ?? null,
    saleLocalUuid: order.saleLocalUuid ?? null,
    ackReceivedAt: order.ackReceivedAt ?? null,
    fiscalDocumentType: order.fiscalDocumentType?.value ?? null,
    fiscalDocumentNumber: order.fiscalDocumentNumber ?? null,
    fiscalAccessKey: order.fiscalAccessKey ?? null,
    fiscalAuthorizationProtocol: order.fiscalAuthorizationProtocol ?? null,
    fiscalEmittedAt: order.fiscalEmittedAt ?? null,
    fiscalEmissionStatus: order.fiscalEmissionStatus ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? null,
  };
}
