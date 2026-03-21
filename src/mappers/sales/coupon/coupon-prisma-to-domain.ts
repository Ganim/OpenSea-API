import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Coupon } from '@/entities/sales/coupon';

export function couponPrismaToDomain(record: {
  id: string;
  tenantId: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number | { toNumber(): number };
  applicableTo: string;
  minOrderValue?: number | null;
  maxDiscountAmount?: number | null;
  maxUsageTotal?: number | null;
  maxUsagePerCustomer?: number | null;
  currentUsageTotal: number;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}): Coupon {
  return Coupon.create(
    {
      tenantId: new UniqueEntityID(record.tenantId),
      code: record.code,
      description: record.description ?? undefined,
      discountType: record.discountType as Coupon['discountType'],
      discountValue:
        typeof record.discountValue === 'number'
          ? record.discountValue
          : record.discountValue.toNumber(),
      applicableTo: record.applicableTo as Coupon['applicableTo'],
      minOrderValue: record.minOrderValue ?? undefined,
      maxDiscountAmount: record.maxDiscountAmount ?? undefined,
      maxUsageTotal: record.maxUsageTotal ?? undefined,
      maxUsagePerCustomer: record.maxUsagePerCustomer ?? undefined,
      currentUsageTotal: record.currentUsageTotal,
      startDate: record.startDate ?? undefined,
      endDate: record.endDate ?? undefined,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt ?? undefined,
    },
    new UniqueEntityID(record.id),
  );
}
