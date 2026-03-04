import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CalendarProps {
  tenantId: UniqueEntityID;
  name: string;
  description?: string | null;
  color?: string | null;
  type: string; // PERSONAL | TEAM | SYSTEM
  ownerId?: string | null;
  systemModule?: string | null;
  isDefault: boolean;
  settings: Record<string, unknown>;
  createdBy: UniqueEntityID;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Calendar extends Entity<CalendarProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  get color(): string | null {
    return this.props.color ?? null;
  }

  set color(color: string | null) {
    this.props.color = color;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }

  get ownerId(): string | null {
    return this.props.ownerId ?? null;
  }

  get systemModule(): string | null {
    return this.props.systemModule ?? null;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get settings(): Record<string, unknown> {
    return this.props.settings;
  }

  set settings(settings: Record<string, unknown>) {
    this.props.settings = settings;
    this.touch();
  }

  get createdBy(): UniqueEntityID {
    return this.props.createdBy;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt ?? null;
  }

  get isPersonal(): boolean {
    return this.props.type === 'PERSONAL';
  }

  get isTeam(): boolean {
    return this.props.type === 'TEAM';
  }

  get isSystem(): boolean {
    return this.props.type === 'SYSTEM';
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = null;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<CalendarProps, 'createdAt' | 'isDefault' | 'settings'> & {
      createdAt?: Date;
      isDefault?: boolean;
      settings?: Record<string, unknown>;
    },
    id?: UniqueEntityID,
  ): Calendar {
    return new Calendar(
      {
        ...props,
        isDefault: props.isDefault ?? false,
        settings: props.settings ?? {},
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
