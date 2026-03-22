import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Coupon, type CouponUsageProps } from '@/entities/sales/coupon';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CouponsRepository,
  CreateCouponSchema,
  FindManyCouponsParams,
  UpdateCouponSchema,
} from '../coupons-repository';

export class InMemoryCouponsRepository implements CouponsRepository {
  public items: Coupon[] = [];

  async create(data: CreateCouponSchema): Promise<Coupon> {
    const coupon = Coupon.create({
      tenantId: new EntityID(data.tenantId),
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      applicableTo: data.applicableTo,
      minOrderValue: data.minOrderValue,
      maxDiscountAmount: data.maxDiscountAmount,
      maxUsageTotal: data.maxUsageTotal,
      maxUsagePerCustomer: data.maxUsagePerCustomer,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? true,
      productIds: data.productIds ?? [],
      categoryIds: data.categoryIds ?? [],
      customerIds: data.customerIds ?? [],
    });

    this.items.push(coupon);
    return coupon;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Coupon | null> {
    const coupon = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return coupon ?? null;
  }

  async findByCode(code: string, tenantId: string): Promise<Coupon | null> {
    const coupon = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.code.toUpperCase() === code.toUpperCase() &&
        item.tenantId.toString() === tenantId,
    );
    return coupon ?? null;
  }

  async findManyPaginated(
    params: FindManyCouponsParams,
  ): Promise<PaginatedResult<Coupon>> {
    let filtered = this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === params.tenantId,
    );

    if (params.isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === params.isActive);
    }

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.code.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return { data, total, page: params.page, limit: params.limit, totalPages };
  }

  async update(data: UpdateCouponSchema): Promise<Coupon | null> {
    const coupon = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!coupon) return null;

    if (data.code !== undefined) coupon.code = data.code;
    if (data.description !== undefined) coupon.description = data.description;
    if (data.isActive !== undefined) coupon.isActive = data.isActive;

    return coupon;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const coupon = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (coupon) {
      coupon.delete();
    }
  }

  async incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void> {
    const coupon = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (coupon) {
      coupon.incrementUsage();
    }
  }

  async recordUsage(
    couponId: UniqueEntityID,
    tenantId: string,
    usage: CouponUsageProps,
  ): Promise<void> {
    const coupon = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(couponId) &&
        item.tenantId.toString() === tenantId,
    );
    if (coupon) {
      coupon.props.usages.push(usage);
      coupon.incrementUsage();
    }
  }
}
