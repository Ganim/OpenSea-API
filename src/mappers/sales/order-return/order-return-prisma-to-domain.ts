import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderReturn } from '@/entities/sales/order-return';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function orderReturnPrismaToDomain(raw: any): OrderReturn {
  return OrderReturn.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      orderId: new UniqueEntityID(raw.orderId),
      returnNumber: raw.returnNumber,
      type: raw.type,
      status: raw.status,
      reason: raw.reason,
      reasonDetails: raw.reasonDetails ?? undefined,
      refundMethod: raw.refundMethod ?? undefined,
      refundAmount: Number(raw.refundAmount ?? 0),
      creditAmount: Number(raw.creditAmount ?? 0),
      exchangeOrderId: raw.exchangeOrderId
        ? new UniqueEntityID(raw.exchangeOrderId)
        : undefined,
      requestedByUserId: new UniqueEntityID(raw.requestedByUserId),
      approvedByUserId: raw.approvedByUserId
        ? new UniqueEntityID(raw.approvedByUserId)
        : undefined,
      approvedAt: raw.approvedAt ?? undefined,
      rejectedReason: raw.rejectedReason ?? undefined,
      receivedAt: raw.receivedAt ?? undefined,
      notes: raw.notes ?? undefined,
      deletedAt: raw.deletedAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
