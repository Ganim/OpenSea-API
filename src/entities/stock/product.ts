import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { ProductStatus } from './value-objects/product-status';
import { UnitOfMeasure } from './value-objects/unit-of-measure';

export interface ProductProps {
  id: UniqueEntityID;
  name: string;
  code: string;
  description?: string;
  status: ProductStatus;
  unitOfMeasure: UnitOfMeasure;
  attributes: Record<string, unknown>;
  templateId: UniqueEntityID;
  supplierId?: UniqueEntityID;
  manufacturerId?: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Product extends Entity<ProductProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get code(): string {
    return this.props.code;
  }

  set code(code: string) {
    this.props.code = code;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(description: string | undefined) {
    this.props.description = description;
    this.touch();
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  set status(status: ProductStatus) {
    this.props.status = status;
    this.touch();
  }

  get unitOfMeasure(): UnitOfMeasure {
    return this.props.unitOfMeasure;
  }

  set unitOfMeasure(unit: UnitOfMeasure) {
    this.props.unitOfMeasure = unit;
    this.touch();
  }

  get attributes(): Record<string, unknown> {
    return this.props.attributes;
  }

  set attributes(attributes: Record<string, unknown>) {
    this.props.attributes = attributes;
    this.touch();
  }

  get templateId(): UniqueEntityID {
    return this.props.templateId;
  }

  get supplierId(): UniqueEntityID | undefined {
    return this.props.supplierId;
  }

  set supplierId(supplierId: UniqueEntityID | undefined) {
    this.props.supplierId = supplierId;
    this.touch();
  }

  get manufacturerId(): UniqueEntityID | undefined {
    return this.props.manufacturerId;
  }

  set manufacturerId(manufacturerId: UniqueEntityID | undefined) {
    this.props.manufacturerId = manufacturerId;
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

  // Computed Properties
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get hasSupplier(): boolean {
    return !!this.props.supplierId;
  }

  get hasManufacturer(): boolean {
    return !!this.props.manufacturerId;
  }

  get canBeSold(): boolean {
    return this.props.status.canBeSold && !this.isDeleted;
  }

  get isPublishable(): boolean {
    return this.props.status.canBePublished && !this.isDeleted;
  }

  // Business Methods
  activate(): void {
    this.status = ProductStatus.create('ACTIVE');
  }

  deactivate(): void {
    this.status = ProductStatus.create('INACTIVE');
  }

  markAsOutOfStock(): void {
    this.status = ProductStatus.create('OUT_OF_STOCK');
  }

  discontinue(): void {
    this.status = ProductStatus.create('DISCONTINUED');
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
      ProductProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ): Product {
    const product = new Product(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return product;
  }
}
