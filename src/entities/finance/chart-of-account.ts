import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ChartOfAccountProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  code: string;
  name: string;
  type: string;
  accountClass: string;
  nature: string;
  parentId?: UniqueEntityID;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class ChartOfAccount extends Entity<ChartOfAccountProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
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

  get type(): string {
    return this.props.type;
  }
  set type(value: string) {
    this.props.type = value;
    this.touch();
  }

  get accountClass(): string {
    return this.props.accountClass;
  }
  set accountClass(value: string) {
    this.props.accountClass = value;
    this.touch();
  }

  get nature(): string {
    return this.props.nature;
  }
  set nature(value: string) {
    this.props.nature = value;
    this.touch();
  }

  get parentId(): UniqueEntityID | undefined {
    return this.props.parentId;
  }
  set parentId(value: UniqueEntityID | undefined) {
    this.props.parentId = value;
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
      ChartOfAccountProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isActive' | 'isSystem'
    >,
    id?: UniqueEntityID,
  ): ChartOfAccount {
    return new ChartOfAccount(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        isSystem: props.isSystem ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
