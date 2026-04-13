import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionWorkstationProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  workstationTypeId: UniqueEntityID;
  workCenterId: UniqueEntityID | null;
  code: string;
  name: string;
  description: string | null;
  capacityPerDay: number;
  costPerHour: number | null;
  setupTimeDefault: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionWorkstation extends Entity<ProductionWorkstationProps> {
  // Getters
  get workstationId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get workstationTypeId(): UniqueEntityID {
    return this.props.workstationTypeId;
  }

  get workCenterId(): UniqueEntityID | null {
    return this.props.workCenterId;
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

  get capacityPerDay(): number {
    return this.props.capacityPerDay;
  }

  get costPerHour(): number | null {
    return this.props.costPerHour;
  }

  get setupTimeDefault(): number {
    return this.props.setupTimeDefault;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Setters
  set workstationTypeId(workstationTypeId: UniqueEntityID) {
    this.props.workstationTypeId = workstationTypeId;
    this.touch();
  }

  set workCenterId(workCenterId: UniqueEntityID | null) {
    this.props.workCenterId = workCenterId;
    this.touch();
  }

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

  set capacityPerDay(capacityPerDay: number) {
    this.props.capacityPerDay = capacityPerDay;
    this.touch();
  }

  set costPerHour(costPerHour: number | null) {
    this.props.costPerHour = costPerHour;
    this.touch();
  }

  set setupTimeDefault(setupTimeDefault: number) {
    this.props.setupTimeDefault = setupTimeDefault;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  set metadata(metadata: Record<string, unknown> | null) {
    this.props.metadata = metadata;
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
      ProductionWorkstationProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'workCenterId'
      | 'description'
      | 'costPerHour'
      | 'isActive'
      | 'metadata'
    >,
    id?: UniqueEntityID,
  ): ProductionWorkstation {
    const workstationId = id ?? props.id ?? new UniqueEntityID();

    const workstation = new ProductionWorkstation(
      {
        ...props,
        id: workstationId,
        workCenterId: props.workCenterId ?? null,
        description: props.description ?? null,
        costPerHour: props.costPerHour ?? null,
        isActive: props.isActive ?? true,
        metadata: props.metadata ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      workstationId,
    );

    return workstation;
  }
}
