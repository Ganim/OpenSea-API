import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface DepartmentProps {
  name: string;
  code: string;
  description?: string;
  parentId?: UniqueEntityID;
  managerId?: UniqueEntityID;
  companyId: UniqueEntityID;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Department extends Entity<DepartmentProps> {
  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get parentId(): UniqueEntityID | undefined {
    return this.props.parentId;
  }

  get managerId(): UniqueEntityID | undefined {
    return this.props.managerId;
  }

  get companyId(): UniqueEntityID {
    return this.props.companyId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  hasParent(): boolean {
    return this.parentId !== undefined;
  }

  hasManager(): boolean {
    return this.managerId !== undefined;
  }

  canHaveEmployees(): boolean {
    return this.isActive && !this.isDeleted();
  }

  // Domain methods
  activate(): void {
    if (this.isDeleted()) {
      throw new Error('Cannot activate a deleted department');
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Department name cannot be empty');
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  assignManager(managerId: UniqueEntityID): void {
    this.props.managerId = managerId;
    this.props.updatedAt = new Date();
  }

  removeManager(): void {
    this.props.managerId = undefined;
    this.props.updatedAt = new Date();
  }

  changeParent(parentId?: UniqueEntityID): void {
    if (parentId && parentId.equals(this.id)) {
      throw new Error('Department cannot be its own parent');
    }
    this.props.parentId = parentId;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  private constructor(props: DepartmentProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<DepartmentProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Department {
    const now = new Date();

    return new Department(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
