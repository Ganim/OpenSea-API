import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ProductionDowntimeReasonCategory =
  | 'MACHINE'
  | 'MATERIAL'
  | 'QUALITY'
  | 'SETUP'
  | 'PLANNING'
  | 'MAINTENANCE'
  | 'OTHER';

export interface ProductionDowntimeReasonProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  code: string;
  name: string;
  category: ProductionDowntimeReasonCategory;
  isActive: boolean;
  createdAt: Date;
}

export class ProductionDowntimeReason extends Entity<ProductionDowntimeReasonProps> {
  // Getters
  get downtimeReasonId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get category(): ProductionDowntimeReasonCategory {
    return this.props.category;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Setters
  set code(code: string) {
    this.props.code = code;
  }

  set name(name: string) {
    this.props.name = name;
  }

  set category(category: ProductionDowntimeReasonCategory) {
    this.props.category = category;
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
  }

  // Business Methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  static create(
    props: Optional<
      ProductionDowntimeReasonProps,
      'id' | 'createdAt' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): ProductionDowntimeReason {
    const downtimeReasonId = id ?? props.id ?? new UniqueEntityID();

    const downtimeReason = new ProductionDowntimeReason(
      {
        ...props,
        id: downtimeReasonId,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      downtimeReasonId,
    );

    return downtimeReason;
  }
}
