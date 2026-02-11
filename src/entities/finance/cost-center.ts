import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CostCenterProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  companyId?: UniqueEntityID;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class CostCenter extends Entity<CostCenterProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get companyId(): UniqueEntityID | undefined {
    return this.props.companyId;
  }
  set companyId(value: UniqueEntityID | undefined) {
    this.props.companyId = value;
    this.touch();
  }

  get code(): string {
    return this.props.code;
  }
  set code(value: string) {
    this.props.code = value;
    this.touch();
  }

  get name(): string {
    return this.props.name;
  }
  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }
  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }
  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get monthlyBudget(): number | undefined {
    return this.props.monthlyBudget;
  }
  set monthlyBudget(value: number | undefined) {
    this.props.monthlyBudget = value;
    this.touch();
  }

  get annualBudget(): number | undefined {
    return this.props.annualBudget;
  }
  set annualBudget(value: number | undefined) {
    this.props.annualBudget = value;
    this.touch();
  }

  get parentId(): UniqueEntityID | undefined {
    return this.props.parentId;
  }
  set parentId(value: UniqueEntityID | undefined) {
    this.props.parentId = value;
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

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  activate(): void {
    this.isActive = true;
  }
  deactivate(): void {
    this.isActive = false;
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
      CostCenterProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): CostCenter {
    return new CostCenter(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
