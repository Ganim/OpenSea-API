import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface BoardProps {
  tenantId: UniqueEntityID;
  title: string;
  description?: string | null;
  type: string;
  teamId?: UniqueEntityID | null;
  ownerId: UniqueEntityID;
  storageFolderId?: string | null;
  gradientId?: string | null;
  visibility: string;
  defaultView: string;
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  position: number;
  archivedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Board extends Entity<BoardProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  set title(title: string) {
    this.props.title = title;
    this.touch();
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }

  get teamId(): UniqueEntityID | null {
    return this.props.teamId ?? null;
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  get storageFolderId(): string | null {
    return this.props.storageFolderId ?? null;
  }

  set storageFolderId(storageFolderId: string | null) {
    this.props.storageFolderId = storageFolderId;
    this.touch();
  }

  get gradientId(): string | null {
    return this.props.gradientId ?? null;
  }

  set gradientId(gradientId: string | null) {
    this.props.gradientId = gradientId;
    this.touch();
  }

  get visibility(): string {
    return this.props.visibility;
  }

  set visibility(visibility: string) {
    this.props.visibility = visibility;
    this.touch();
  }

  get defaultView(): string {
    return this.props.defaultView;
  }

  set defaultView(defaultView: string) {
    this.props.defaultView = defaultView;
    this.touch();
  }

  get settings(): Record<string, unknown> | null {
    return this.props.settings ?? null;
  }

  set settings(settings: Record<string, unknown> | null) {
    this.props.settings = settings;
    this.touch();
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata ?? null;
  }

  set metadata(metadata: Record<string, unknown> | null) {
    this.props.metadata = metadata;
    this.touch();
  }

  get position(): number {
    return this.props.position;
  }

  set position(position: number) {
    this.props.position = position;
    this.touch();
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt ?? null;
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

  get isArchived(): boolean {
    return !!this.props.archivedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  archive(): void {
    this.props.archivedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.archivedAt = null;
    this.touch();
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<
      BoardProps,
      'createdAt' | 'type' | 'visibility' | 'defaultView' | 'position'
    > & {
      createdAt?: Date;
      type?: string;
      visibility?: string;
      defaultView?: string;
      position?: number;
    },
    id?: UniqueEntityID,
  ): Board {
    return new Board(
      {
        ...props,
        type: props.type ?? 'PERSONAL',
        visibility: props.visibility ?? 'PRIVATE',
        defaultView: props.defaultView ?? 'KANBAN',
        position: props.position ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
