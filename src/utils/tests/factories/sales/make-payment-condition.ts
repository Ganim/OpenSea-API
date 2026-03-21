import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PaymentCondition,
  type PaymentConditionType,
} from '@/entities/sales/payment-condition';
import { faker } from '@faker-js/faker';

interface MakePaymentConditionProps {
  tenantId?: UniqueEntityID;
  name?: string;
  description?: string;
  type?: PaymentConditionType;
  installments?: number;
  firstDueDays?: number;
  intervalDays?: number;
  downPaymentPercent?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export function makePaymentCondition(
  override: MakePaymentConditionProps = {},
): PaymentCondition {
  return PaymentCondition.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      name: override.name ?? faker.commerce.productName(),
      description: override.description,
      type: override.type ?? 'CASH',
      installments: override.installments,
      firstDueDays: override.firstDueDays,
      intervalDays: override.intervalDays,
      downPaymentPercent: override.downPaymentPercent,
      isActive: override.isActive,
      isDefault: override.isDefault,
    },
    new UniqueEntityID(),
  );
}
