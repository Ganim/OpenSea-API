import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ComboType = 'FIXED' | 'DYNAMIC';
export type ComboDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PRICE';

export interface ComboItemProps {
  id: UniqueEntityID;
  comboId: UniqueEntityID;
  productId?: UniqueEntityID;
  variantId?: UniqueEntityID;
  categoryId?: UniqueEntityID;
  quantity: number;
  sortOrder: number;
  createdAt: Date;
}

export interface ComboProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  type: ComboType;
  discountType: ComboDiscountType;
  discountValue: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  items: ComboItemProps[];
  categoryIds: string[];
  minItems?: number;
  maxItems?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Combo extends Entity<ComboProps> {
  get comboId(): UniqueEntityID {
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

  get type(): ComboType {
    return this.props.type;
  }

  get discountType(): ComboDiscountType {
    return this.props.discountType;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get startDate(): Date | undefined {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get items(): ComboItemProps[] {
    return this.props.items;
  }

  get categoryIds(): string[] {
    return this.props.categoryIds;
  }

  get minItems(): number | undefined {
    return this.props.minItems;
  }

  get maxItems(): number | undefined {
    return this.props.maxItems;
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

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ComboProps,
      'id' | 'isActive' | 'items' | 'categoryIds' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): Combo {
    const comboId = id ?? props.id ?? new UniqueEntityID();

    const combo = new Combo(
      {
        ...props,
        id: comboId,
        isActive: props.isActive ?? true,
        items: props.items ?? [],
        categoryIds: props.categoryIds ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      comboId,
    );

    return combo;
  }
}
