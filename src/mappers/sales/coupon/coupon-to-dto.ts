import type { Coupon } from '@/entities/sales/coupon';

export interface CouponDTO {
  id: string;
  tenantId: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  applicableTo: string;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  currentUsageTotal: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function couponToDTO(coupon: Coupon): CouponDTO {
  const dto: CouponDTO = {
    id: coupon.couponId.toString(),
    tenantId: coupon.tenantId.toString(),
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    applicableTo: coupon.applicableTo,
    currentUsageTotal: coupon.currentUsageTotal,
    isActive: coupon.isActive,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };

  if (coupon.description) dto.description = coupon.description;
  if (coupon.minOrderValue !== undefined) dto.minOrderValue = coupon.minOrderValue;
  if (coupon.maxDiscountAmount !== undefined) dto.maxDiscountAmount = coupon.maxDiscountAmount;
  if (coupon.maxUsageTotal !== undefined) dto.maxUsageTotal = coupon.maxUsageTotal;
  if (coupon.maxUsagePerCustomer !== undefined) dto.maxUsagePerCustomer = coupon.maxUsagePerCustomer;
  if (coupon.startDate) dto.startDate = coupon.startDate;
  if (coupon.endDate) dto.endDate = coupon.endDate;

  return dto;
}
