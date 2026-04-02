import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface DiscountRuleProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderValue?: number;
  minQuantity?: number;
  categoryId?: string;
  productId?: string;
  customerId?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number;
  isStackable: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class DiscountRule extends Entity<DiscountRuleProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get type(): 'PERCENTAGE' | 'FIXED_AMOUNT' {
    return this.props.type;
  }

  set type(value: 'PERCENTAGE' | 'FIXED_AMOUNT') {
    this.props.type = value;
    this.touch();
  }

  get value(): number {
    return this.props.value;
  }

  set value(val: number) {
    this.props.value = val;
    this.touch();
  }

  get minOrderValue(): number | undefined {
    return this.props.minOrderValue;
  }

  set minOrderValue(val: number | undefined) {
    this.props.minOrderValue = val;
    this.touch();
  }

  get minQuantity(): number | undefined {
    return this.props.minQuantity;
  }

  set minQuantity(val: number | undefined) {
    this.props.minQuantity = val;
    this.touch();
  }

  get categoryId(): string | undefined {
    return this.props.categoryId;
  }

  set categoryId(val: string | undefined) {
    this.props.categoryId = val;
    this.touch();
  }

  get productId(): string | undefined {
    return this.props.productId;
  }

  set productId(val: string | undefined) {
    this.props.productId = val;
    this.touch();
  }

  get customerId(): string | undefined {
    return this.props.customerId;
  }

  set customerId(val: string | undefined) {
    this.props.customerId = val;
    this.touch();
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  set startDate(val: Date) {
    this.props.startDate = val;
    this.touch();
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  set endDate(val: Date) {
    this.props.endDate = val;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(val: boolean) {
    this.props.isActive = val;
    this.touch();
  }

  get priority(): number {
    return this.props.priority;
  }

  set priority(val: number) {
    this.props.priority = val;
    this.touch();
  }

  get isStackable(): boolean {
    return this.props.isStackable;
  }

  set isStackable(val: boolean) {
    this.props.isStackable = val;
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.props.isActive = true;
    this.touch();
  }

  isCurrentlyActive(): boolean {
    if (!this.isActive || this.isDeleted) return false;
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  static create(
    props: Optional<
      DiscountRuleProps,
      'id' | 'isActive' | 'priority' | 'isStackable' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): DiscountRule {
    return new DiscountRule(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        priority: props.priority ?? 0,
        isStackable: props.isStackable ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
