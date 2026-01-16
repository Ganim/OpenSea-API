import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface WarehouseProps {
  id: UniqueEntityID;
  code: string;
  name: string;
  description: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Warehouse extends Entity<WarehouseProps> {
  // Getters
  get warehouseId(): UniqueEntityID {
    return this.props.id;
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

  get address(): string | null {
    return this.props.address;
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

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Setters
  set code(code: string) {
    if (code.length < 2 || code.length > 5) {
      throw new Error('Warehouse code must be between 2 and 5 characters');
    }
    this.props.code = code.toUpperCase();
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

  set address(address: string | null) {
    this.props.address = address;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  // Computed Properties
  get hasDescription(): boolean {
    return this.description !== null && this.description.trim().length > 0;
  }

  get hasAddress(): boolean {
    return this.address !== null && this.address.trim().length > 0;
  }

  // Business Methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      WarehouseProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): Warehouse {
    const warehouseId = id ?? props.id ?? new UniqueEntityID();

    const warehouse = new Warehouse(
      {
        ...props,
        id: warehouseId,
        code: props.code.toUpperCase(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      warehouseId,
    );

    return warehouse;
  }
}
