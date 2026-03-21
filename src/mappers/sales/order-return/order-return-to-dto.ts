import type { OrderReturn } from '@/entities/sales/order-return';

export interface OrderReturnDTO {
  id: string;
  orderId: string;
  returnNumber: string;
  type: string;
  status: string;
  reason: string;
  reasonDetails: string | null;
  refundMethod: string | null;
  refundAmount: number;
  creditAmount: number;
  exchangeOrderId: string | null;
  requestedByUserId: string;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  rejectedReason: string | null;
  receivedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function orderReturnToDTO(ret: OrderReturn): OrderReturnDTO {
  return {
    id: ret.id.toString(),
    orderId: ret.orderId.toString(),
    returnNumber: ret.returnNumber,
    type: ret.type,
    status: ret.status,
    reason: ret.reason,
    reasonDetails: ret.reasonDetails ?? null,
    refundMethod: ret.refundMethod ?? null,
    refundAmount: ret.refundAmount,
    creditAmount: ret.creditAmount,
    exchangeOrderId: ret.exchangeOrderId?.toString() ?? null,
    requestedByUserId: ret.requestedByUserId.toString(),
    approvedByUserId: ret.approvedByUserId?.toString() ?? null,
    approvedAt: ret.approvedAt ?? null,
    rejectedReason: ret.rejectedReason ?? null,
    receivedAt: ret.receivedAt ?? null,
    notes: ret.notes ?? null,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt ?? null,
  };
}
