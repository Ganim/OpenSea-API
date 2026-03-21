import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
export type CouponApplicableTo = 'ALL' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES' | 'SPECIFIC_CUSTOMERS';

export interface CouponUsageProps {
  id: UniqueEntityID;
  couponId: UniqueEntityID;
  customerId: UniqueEntityID;
  orderId?: UniqueEntityID;
  discountApplied: number;
  usedAt: Date;
}

export interface CouponProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  applicableTo: CouponApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  currentUsageTotal: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  productIds: string[];
  categoryIds: string[];
  customerIds: string[];
  usages: CouponUsageProps[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Coupon extends Entity<CouponProps> {
  get couponId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get code(): string {
    return this.props.code;
  }

  set code(value: string) {
    this.props.code = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get discountType(): CouponDiscountType {
    return this.props.discountType;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get applicableTo(): CouponApplicableTo {
    return this.props.applicableTo;
  }

  get minOrderValue(): number | undefined {
    return this.props.minOrderValue;
  }

  get maxDiscountAmount(): number | undefined {
    return this.props.maxDiscountAmount;
  }

  get maxUsageTotal(): number | undefined {
    return this.props.maxUsageTotal;
  }

  get maxUsagePerCustomer(): number | undefined {
    return this.props.maxUsagePerCustomer;
  }

  get currentUsageTotal(): number {
    return this.props.currentUsageTotal;
  }

  get startDate(): Date | undefined {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get productIds(): string[] {
    return this.props.productIds;
  }

  get categoryIds(): string[] {
    return this.props.categoryIds;
  }

  get customerIds(): string[] {
    return this.props.customerIds;
  }

  get usages(): CouponUsageProps[] {
    return this.props.usages;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  incrementUsage(): void {
    this.props.currentUsageTotal += 1;
    this.touch();
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  getUsageCountForCustomer(customerId: string): number {
    return this.props.usages.filter(
      (u) => u.customerId.toString() === customerId,
    ).length;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      CouponProps,
      | 'id'
      | 'currentUsageTotal'
      | 'isActive'
      | 'productIds'
      | 'categoryIds'
      | 'customerIds'
      | 'usages'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): Coupon {
    const couponId = id ?? props.id ?? new UniqueEntityID();

    const coupon = new Coupon(
      {
        ...props,
        id: couponId,
        currentUsageTotal: props.currentUsageTotal ?? 0,
        isActive: props.isActive ?? true,
        productIds: props.productIds ?? [],
        categoryIds: props.categoryIds ?? [],
        customerIds: props.customerIds ?? [],
        usages: props.usages ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      couponId,
    );

    return coupon;
  }
}
