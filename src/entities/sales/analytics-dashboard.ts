import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface AnalyticsDashboardProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  isDefault: boolean;
  isSystem: boolean;
  role?: string;
  visibility: string;
  layout?: Record<string, unknown>;
  createdByUserId: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class AnalyticsDashboard extends Entity<AnalyticsDashboardProps> {
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

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get role(): string | undefined {
    return this.props.role;
  }

  get visibility(): string {
    return this.props.visibility;
  }

  set visibility(value: string) {
    this.props.visibility = value;
    this.touch();
  }

  get layout(): Record<string, unknown> | undefined {
    return this.props.layout;
  }

  get createdByUserId(): string {
    return this.props.createdByUserId;
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  static create(
    props: Optional<
      AnalyticsDashboardProps,
      'id' | 'isDefault' | 'isSystem' | 'visibility' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): AnalyticsDashboard {
    return new AnalyticsDashboard(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isDefault: props.isDefault ?? false,
        isSystem: props.isSystem ?? false,
        visibility: props.visibility ?? 'PRIVATE',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
