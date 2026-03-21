import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PriceTableProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  type: string;
  currency: string;
  priceIncludesTax: boolean;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class PriceTable extends Entity<PriceTableProps> {
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

  get type(): string {
    return this.props.type;
  }

  set type(value: string) {
    this.props.type = value;
    this.touch();
  }

  get currency(): string {
    return this.props.currency;
  }

  set currency(value: string) {
    this.props.currency = value;
    this.touch();
  }

  get priceIncludesTax(): boolean {
    return this.props.priceIncludesTax;
  }

  set priceIncludesTax(value: boolean) {
    this.props.priceIncludesTax = value;
    this.touch();
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  set isDefault(value: boolean) {
    this.props.isDefault = value;
    this.touch();
  }

  get priority(): number {
    return this.props.priority;
  }

  set priority(value: number) {
    this.props.priority = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get validFrom(): Date | undefined {
    return this.props.validFrom;
  }

  set validFrom(value: Date | undefined) {
    this.props.validFrom = value;
    this.touch();
  }

  get validUntil(): Date | undefined {
    return this.props.validUntil;
  }

  set validUntil(value: Date | undefined) {
    this.props.validUntil = value;
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
      PriceTableProps,
      | 'id'
      | 'createdAt'
      | 'type'
      | 'currency'
      | 'priceIncludesTax'
      | 'isDefault'
      | 'priority'
      | 'isActive'
    >,
    id?: UniqueEntityID,
  ): PriceTable {
    const priceTable = new PriceTable(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        type: props.type ?? 'DEFAULT',
        currency: props.currency ?? 'BRL',
        priceIncludesTax: props.priceIncludesTax ?? true,
        isDefault: props.isDefault ?? false,
        priority: props.priority ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return priceTable;
  }
}
