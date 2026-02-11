import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FinanceCategoryProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  type: string;
  parentId?: UniqueEntityID;
  displayOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class FinanceCategory extends Entity<FinanceCategoryProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }
  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get slug(): string {
    return this.props.slug;
  }
  set slug(value: string) {
    this.props.slug = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }
  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get iconUrl(): string | undefined {
    return this.props.iconUrl;
  }
  set iconUrl(value: string | undefined) {
    this.props.iconUrl = value;
    this.touch();
  }

  get color(): string | undefined {
    return this.props.color;
  }
  set color(value: string | undefined) {
    this.props.color = value;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }
  set type(value: string) {
    this.props.type = value;
    this.touch();
  }

  get parentId(): UniqueEntityID | undefined {
    return this.props.parentId;
  }
  set parentId(value: UniqueEntityID | undefined) {
    this.props.parentId = value;
    this.touch();
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }
  set displayOrder(value: number) {
    this.props.displayOrder = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }
  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get isSystem(): boolean {
    return this.props.isSystem;
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
      FinanceCategoryProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isActive'
      | 'isSystem'
      | 'displayOrder'
    >,
    id?: UniqueEntityID,
  ): FinanceCategory {
    return new FinanceCategory(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        isSystem: props.isSystem ?? false,
        displayOrder: props.displayOrder ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
