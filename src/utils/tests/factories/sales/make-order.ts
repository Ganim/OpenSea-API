import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Order,
  type OrderChannel,
  type OrderType,
} from '@/entities/sales/order';
import { faker } from '@faker-js/faker';

interface MakeOrderProps {
  tenantId?: UniqueEntityID;
  orderNumber?: string;
  type?: OrderType;
  customerId?: UniqueEntityID;
  contactId?: UniqueEntityID;
  pipelineId?: UniqueEntityID;
  stageId?: UniqueEntityID;
  channel?: OrderChannel;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  shippingTotal?: number;
  grandTotal?: number;
  currency?: string;
  priceTableId?: UniqueEntityID;
  paymentConditionId?: UniqueEntityID;
  creditUsed?: number;
  paidAmount?: number;
  remainingAmount?: number;
  needsApproval?: boolean;
  assignedToUserId?: UniqueEntityID;
  dealId?: UniqueEntityID;
  quoteId?: UniqueEntityID;
  notes?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function makeOrder(override: MakeOrderProps = {}): Order {
  const subtotal =
    override.subtotal ?? Number(faker.commerce.price({ min: 100, max: 10000 }));

  return Order.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      orderNumber:
        override.orderNumber ??
        `ORD-${faker.string.alphanumeric(6).toUpperCase()}`,
      type: override.type ?? 'ORDER',
      customerId: override.customerId ?? new UniqueEntityID(),
      contactId: override.contactId,
      pipelineId: override.pipelineId ?? new UniqueEntityID(),
      stageId: override.stageId ?? new UniqueEntityID(),
      channel: override.channel ?? 'MANUAL',
      subtotal,
      discountTotal: override.discountTotal,
      taxTotal: override.taxTotal,
      shippingTotal: override.shippingTotal,
      grandTotal: override.grandTotal,
      currency: override.currency,
      priceTableId: override.priceTableId,
      paymentConditionId: override.paymentConditionId,
      creditUsed: override.creditUsed,
      paidAmount: override.paidAmount,
      remainingAmount: override.remainingAmount,
      needsApproval: override.needsApproval,
      assignedToUserId: override.assignedToUserId,
      dealId: override.dealId,
      quoteId: override.quoteId,
      notes: override.notes,
      tags: override.tags,
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );
}
