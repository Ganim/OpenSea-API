import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  OrderReturn,
  type ReturnReason,
  type ReturnType,
} from '@/entities/sales/order-return';
import { faker } from '@faker-js/faker';

interface MakeOrderReturnProps {
  tenantId?: UniqueEntityID;
  orderId?: UniqueEntityID;
  returnNumber?: string;
  type?: ReturnType;
  reason?: ReturnReason;
  reasonDetails?: string;
  requestedByUserId?: UniqueEntityID;
  notes?: string;
}

export function makeOrderReturn(
  override: MakeOrderReturnProps = {},
): OrderReturn {
  return OrderReturn.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      orderId: override.orderId ?? new UniqueEntityID(),
      returnNumber:
        override.returnNumber ??
        `RET-${faker.string.alphanumeric(4).toUpperCase()}`,
      type: override.type ?? 'PARTIAL_RETURN',
      reason: override.reason ?? 'DEFECTIVE',
      reasonDetails: override.reasonDetails,
      requestedByUserId: override.requestedByUserId ?? new UniqueEntityID(),
      notes: override.notes,
    },
    new UniqueEntityID(),
  );
}
