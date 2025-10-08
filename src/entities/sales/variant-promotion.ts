import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { DiscountType } from './value-objects/discount-type';

export interface VariantPromotionProps {
  id: UniqueEntityID;
  variantId: UniqueEntityID;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class VariantPromotion extends Entity<VariantPromotionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get variantId(): UniqueEntityID {
    return this.props.variantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get discountType(): DiscountType {
    return this.props.discountType;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  set discountValue(value: number) {
    if (value < 0) {
      throw new Error('Discount value cannot be negative');
    }
    if (this.discountType.isPercentage && value > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }
    this.props.discountValue = value;
    this.touch();
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  set startDate(value: Date) {
    if (value > this.props.endDate) {
      throw new Error('Start date cannot be after end date');
    }
    this.props.startDate = value;
    this.touch();
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  set endDate(value: Date) {
    if (value < this.props.startDate) {
      throw new Error('End date cannot be before start date');
    }
    this.props.endDate = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get isCurrentlyValid(): boolean {
    const now = new Date();
    return (
      !this.props.deletedAt &&
      this.props.isActive &&
      now >= this.props.startDate &&
      now <= this.props.endDate
    );
  }

  get isExpired(): boolean {
    return new Date() > this.props.endDate;
  }

  get isUpcoming(): boolean {
    return new Date() < this.props.startDate;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  activate() {
    this.props.isActive = true;
    this.touch();
  }

  deactivate() {
    this.props.isActive = false;
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.touch();
  }

  calculateDiscount(originalPrice: number): number {
    if (!this.isCurrentlyValid) {
      return 0;
    }

    if (this.discountType.isPercentage) {
      return (originalPrice * this.discountValue) / 100;
    }

    return this.discountValue;
  }

  calculateFinalPrice(originalPrice: number): number {
    return originalPrice - this.calculateDiscount(originalPrice);
  }

  static create(
    props: Optional<VariantPromotionProps, 'id' | 'isActive' | 'createdAt'>,
    id?: UniqueEntityID,
  ): VariantPromotion {
    const promotion = new VariantPromotion(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return promotion;
  }
}
