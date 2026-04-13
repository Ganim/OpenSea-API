import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionWorkstationTypeProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionWorkstationType extends Entity<ProductionWorkstationTypeProps> {
  // Getters
  get workstationTypeId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get icon(): string | null {
    return this.props.icon;
  }

  get color(): string | null {
    return this.props.color;
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
  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set icon(icon: string | null) {
    this.props.icon = icon;
    this.touch();
  }

  set color(color: string | null) {
    this.props.color = color;
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
      ProductionWorkstationTypeProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'description'
      | 'icon'
      | 'color'
      | 'isActive'
    >,
    id?: UniqueEntityID,
  ): ProductionWorkstationType {
    const workstationTypeId = id ?? props.id ?? new UniqueEntityID();

    const workstationType = new ProductionWorkstationType(
      {
        ...props,
        id: workstationTypeId,
        description: props.description ?? null,
        icon: props.icon ?? null,
        color: props.color ?? null,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      workstationTypeId,
    );

    return workstationType;
  }
}
