import type { PaymentCondition } from '@/entities/sales/payment-condition';

export interface PaymentConditionDTO {
  id: string;
  name: string;
  description: string | null;
  type: string;
  installments: number;
  firstDueDays: number;
  intervalDays: number;
  downPaymentPercent: number | null;
  interestRate: number | null;
  interestType: string;
  penaltyRate: number | null;
  discountCash: number | null;
  applicableTo: string;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export function paymentConditionToDTO(
  condition: PaymentCondition,
): PaymentConditionDTO {
  return {
    id: condition.id.toString(),
    name: condition.name,
    description: condition.description ?? null,
    type: condition.type,
    installments: condition.installments,
    firstDueDays: condition.firstDueDays,
    intervalDays: condition.intervalDays,
    downPaymentPercent: condition.downPaymentPercent ?? null,
    interestRate: condition.interestRate ?? null,
    interestType: condition.interestType,
    penaltyRate: condition.penaltyRate ?? null,
    discountCash: condition.discountCash ?? null,
    applicableTo: condition.applicableTo,
    minOrderValue: condition.minOrderValue ?? null,
    maxOrderValue: condition.maxOrderValue ?? null,
    isActive: condition.isActive,
    isDefault: condition.isDefault,
    createdAt: condition.createdAt,
    updatedAt: condition.updatedAt ?? null,
  };
}
