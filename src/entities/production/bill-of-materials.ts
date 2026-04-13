import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ProductionBomStatus = 'DRAFT' | 'ACTIVE' | 'OBSOLETE';

export interface ProductionBomProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  productId: UniqueEntityID;
  version: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  validFrom: Date;
  validUntil: Date | null;
  status: ProductionBomStatus;
  baseQuantity: number;
  createdById: UniqueEntityID;
  approvedById: UniqueEntityID | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionBom extends Entity<ProductionBomProps> {
  // Getters
  get bomId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get productId(): UniqueEntityID {
    return this.props.productId;
  }

  get version(): number {
    return this.props.version;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get validFrom(): Date {
    return this.props.validFrom;
  }

  get validUntil(): Date | null {
    return this.props.validUntil;
  }

  get status(): ProductionBomStatus {
    return this.props.status;
  }

  get baseQuantity(): number {
    return this.props.baseQuantity;
  }

  get createdById(): UniqueEntityID {
    return this.props.createdById;
  }

  get approvedById(): UniqueEntityID | null {
    return this.props.approvedById;
  }

  get approvedAt(): Date | null {
    return this.props.approvedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Setters
  set productId(productId: UniqueEntityID) {
    this.props.productId = productId;
    this.touch();
  }

  set version(version: string) {
    this.props.version = version;
    this.touch();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set isDefault(isDefault: boolean) {
    this.props.isDefault = isDefault;
    this.touch();
  }

  set validFrom(validFrom: Date) {
    this.props.validFrom = validFrom;
    this.touch();
  }

  set validUntil(validUntil: Date | null) {
    this.props.validUntil = validUntil;
    this.touch();
  }

  set status(status: ProductionBomStatus) {
    this.props.status = status;
    this.touch();
  }

  set baseQuantity(baseQuantity: number) {
    this.props.baseQuantity = baseQuantity;
    this.touch();
  }

  // Business Methods
  activate(): void {
    this.status = 'ACTIVE';
  }

  markObsolete(): void {
    this.status = 'OBSOLETE';
  }

  approve(userId: string): void {
    this.props.approvedById = new UniqueEntityID(userId);
    this.props.approvedAt = new Date();
    this.status = 'ACTIVE';
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionBomProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'description'
      | 'isDefault'
      | 'validUntil'
      | 'status'
      | 'approvedById'
      | 'approvedAt'
    >,
    id?: UniqueEntityID,
  ): ProductionBom {
    const bomId = id ?? props.id ?? new UniqueEntityID();

    const bom = new ProductionBom(
      {
        ...props,
        id: bomId,
        description: props.description ?? null,
        isDefault: props.isDefault ?? false,
        validUntil: props.validUntil ?? null,
        status: props.status ?? 'DRAFT',
        approvedById: props.approvedById ?? null,
        approvedAt: props.approvedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      bomId,
    );

    return bom;
  }
}
