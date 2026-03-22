import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PaymentCondition } from '@/entities/sales/payment-condition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function paymentConditionPrismaToDomain(raw: any): PaymentCondition {
  return PaymentCondition.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      description: raw.description ?? undefined,
      type: raw.type,
      installments: raw.installments,
      firstDueDays: raw.firstDueDays,
      intervalDays: raw.intervalDays,
      downPaymentPercent: raw.downPaymentPercent
        ? Number(raw.downPaymentPercent)
        : undefined,
      interestRate: raw.interestRate ? Number(raw.interestRate) : undefined,
      interestType: raw.interestType,
      penaltyRate: raw.penaltyRate ? Number(raw.penaltyRate) : undefined,
      discountCash: raw.discountCash ? Number(raw.discountCash) : undefined,
      applicableTo: raw.applicableTo,
      minOrderValue: raw.minOrderValue ? Number(raw.minOrderValue) : undefined,
      maxOrderValue: raw.maxOrderValue ? Number(raw.maxOrderValue) : undefined,
      isActive: raw.isActive,
      isDefault: raw.isDefault,
      deletedAt: raw.deletedAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
