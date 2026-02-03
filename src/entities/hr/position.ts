import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PositionProps {
  tenantId: UniqueEntityID;
  name: string;
  code: string;
  description?: string;
  departmentId?: UniqueEntityID;
  level: number;
  minSalary?: number;
  maxSalary?: number;
  baseSalary?: number;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Position extends Entity<PositionProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get departmentId(): UniqueEntityID | undefined {
    return this.props.departmentId;
  }

  get level(): number {
    return this.props.level;
  }

  get minSalary(): number | undefined {
    return this.props.minSalary;
  }

  get maxSalary(): number | undefined {
    return this.props.maxSalary;
  }

  get baseSalary(): number | undefined {
    return this.props.baseSalary;
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

  hasDepartment(): boolean {
    return this.departmentId !== undefined;
  }

  hasSalaryRange(): boolean {
    return this.minSalary !== undefined || this.maxSalary !== undefined;
  }

  canHaveEmployees(): boolean {
    return this.isActive && !this.isDeleted();
  }

  isSalaryInRange(salary: number): boolean {
    if (this.minSalary !== undefined && salary < this.minSalary) {
      return false;
    }
    if (this.maxSalary !== undefined && salary > this.maxSalary) {
      return false;
    }
    return true;
  }

  // Domain methods
  activate(): void {
    if (this.isDeleted()) {
      throw new Error('Cannot activate a deleted position');
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
      throw new Error('Position name cannot be empty');
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateLevel(level: number): void {
    if (level < 1) {
      throw new Error('Position level must be at least 1');
    }
    this.props.level = level;
    this.props.updatedAt = new Date();
  }

  updateSalaryRange(minSalary?: number, maxSalary?: number): void {
    if (
      minSalary !== undefined &&
      maxSalary !== undefined &&
      minSalary > maxSalary
    ) {
      throw new Error('Minimum salary cannot be greater than maximum salary');
    }
    this.props.minSalary = minSalary;
    this.props.maxSalary = maxSalary;
    this.props.updatedAt = new Date();
  }

  updateBaseSalary(baseSalary?: number): void {
    if (baseSalary !== undefined && baseSalary < 0) {
      throw new Error('Base salary cannot be negative');
    }
    this.props.baseSalary = baseSalary;
    this.props.updatedAt = new Date();
  }

  changeDepartment(departmentId?: UniqueEntityID): void {
    this.props.departmentId = departmentId;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  private constructor(props: PositionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<PositionProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Position {
    const now = new Date();

    return new Position(
      {
        ...props,
        level: props.level ?? 1,
        isActive: props.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
