import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionWorkCenterProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionWorkCenter extends Entity<ProductionWorkCenterProps> {
  // Getters
  get workCenterId(): UniqueEntityID {
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

  get description(): string | null {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Setters
  set code(code: string) {
    this.props.code = code;
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

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  // Business Methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionWorkCenterProps,
      'id' | 'createdAt' | 'updatedAt' | 'description' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): ProductionWorkCenter {
    const workCenterId = id ?? props.id ?? new UniqueEntityID();

    const workCenter = new ProductionWorkCenter(
      {
        ...props,
        id: workCenterId,
        description: props.description ?? null,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      workCenterId,
    );

    return workCenter;
  }
}
