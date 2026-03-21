import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Coupon,
  CouponApplicableTo,
  CouponDiscountType,
  CouponUsageProps,
} from '@/entities/sales/coupon';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CreateCouponSchema {
  tenantId: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  applicableTo: CouponApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
}

export interface UpdateCouponSchema {
  id: UniqueEntityID;
  tenantId: string;
  code?: string;
  description?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  applicableTo?: CouponApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
}

export interface FindManyCouponsParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CouponsRepository {
  create(data: CreateCouponSchema): Promise<Coupon>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Coupon | null>;
  findByCode(code: string, tenantId: string): Promise<Coupon | null>;
  findManyPaginated(
    params: FindManyCouponsParams,
  ): Promise<PaginatedResult<Coupon>>;
  update(data: UpdateCouponSchema): Promise<Coupon | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void>;
  recordUsage(
    couponId: UniqueEntityID,
    tenantId: string,
    usage: CouponUsageProps,
  ): Promise<void>;
}
