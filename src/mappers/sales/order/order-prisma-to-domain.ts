import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Order } from '@/entities/sales/order';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function orderPrismaToDomain(raw: any): Order {
  return Order.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      orderNumber: raw.orderNumber,
      type: raw.type,
      customerId: new UniqueEntityID(raw.customerId),
      contactId: raw.contactId ? new UniqueEntityID(raw.contactId) : undefined,
      pipelineId: new UniqueEntityID(raw.pipelineId),
      stageId: new UniqueEntityID(raw.stageId),
      channel: raw.channel,
      subtotal: Number(raw.subtotal),
      discountTotal: Number(raw.discountTotal ?? 0),
      taxTotal: Number(raw.taxTotal ?? 0),
      shippingTotal: Number(raw.shippingTotal ?? 0),
      grandTotal: Number(raw.grandTotal),
      currency: raw.currency,
      priceTableId: raw.priceTableId
        ? new UniqueEntityID(raw.priceTableId)
        : undefined,
      paymentConditionId: raw.paymentConditionId
        ? new UniqueEntityID(raw.paymentConditionId)
        : undefined,
      creditUsed: Number(raw.creditUsed ?? 0),
      paidAmount: Number(raw.paidAmount ?? 0),
      remainingAmount: Number(raw.remainingAmount ?? 0),
      deliveryMethod: raw.deliveryMethod ?? undefined,
      deliveryAddress: raw.deliveryAddress as
        | Record<string, unknown>
        | undefined,
      trackingCode: raw.trackingCode ?? undefined,
      carrierName: raw.carrierName ?? undefined,
      estimatedDelivery: raw.estimatedDelivery ?? undefined,
      deliveredAt: raw.deliveredAt ?? undefined,
      needsApproval: raw.needsApproval ?? false,
      approvedByUserId: raw.approvedByUserId
        ? new UniqueEntityID(raw.approvedByUserId)
        : undefined,
      approvedAt: raw.approvedAt ?? undefined,
      approvalNotes: raw.approvalNotes ?? undefined,
      rejectedReason: raw.rejectedReason ?? undefined,
      dealId: raw.dealId ? new UniqueEntityID(raw.dealId) : undefined,
      quoteId: raw.quoteId ? new UniqueEntityID(raw.quoteId) : undefined,
      returnOriginId: raw.returnOriginId
        ? new UniqueEntityID(raw.returnOriginId)
        : undefined,
      couponId: raw.couponId ? new UniqueEntityID(raw.couponId) : undefined,
      sourceWarehouseId: raw.sourceWarehouseId
        ? new UniqueEntityID(raw.sourceWarehouseId)
        : undefined,
      assignedToUserId: raw.assignedToUserId
        ? new UniqueEntityID(raw.assignedToUserId)
        : undefined,
      notes: raw.notes ?? undefined,
      internalNotes: raw.internalNotes ?? undefined,
      tags: raw.tags ?? [],
      customFields: raw.customFields as
        | Record<string, unknown>
        | undefined,
      stageEnteredAt: raw.stageEnteredAt,
      confirmedAt: raw.confirmedAt ?? undefined,
      cancelledAt: raw.cancelledAt ?? undefined,
      cancelReason: raw.cancelReason ?? undefined,
      expiresAt: raw.expiresAt ?? undefined,
      deletedAt: raw.deletedAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
