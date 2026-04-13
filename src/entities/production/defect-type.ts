import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ProductionDefectTypeSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface ProductionDefectTypeProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  code: string;
  name: string;
  description: string | null;
  severity: ProductionDefectTypeSeverity;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionDefectType extends Entity<ProductionDefectTypeProps> {
  // Getters
  get defectTypeId(): UniqueEntityID {
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

  get severity(): ProductionDefectTypeSeverity {
    return this.props.severity;
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

  set severity(severity: ProductionDefectTypeSeverity) {
    this.props.severity = severity;
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
      ProductionDefectTypeProps,
      'id' | 'createdAt' | 'updatedAt' | 'description' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): ProductionDefectType {
    const defectTypeId = id ?? props.id ?? new UniqueEntityID();

    const defectType = new ProductionDefectType(
      {
        ...props,
        id: defectTypeId,
        description: props.description ?? null,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      defectTypeId,
    );

    return defectType;
  }
}
