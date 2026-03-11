import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CardProps {
  boardId: UniqueEntityID;
  columnId: UniqueEntityID;
  parentCardId?: UniqueEntityID | null;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  position: number;
  assigneeId?: UniqueEntityID | null;
  reporterId: UniqueEntityID;
  startDate?: Date | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  estimatedMinutes?: number | null;
  coverColor?: string | null;
  coverImageId?: string | null;
  metadata?: Record<string, unknown> | null;
  systemSourceType?: string | null;
  systemSourceId?: string | null;
  archivedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Card extends Entity<CardProps> {
  get boardId(): UniqueEntityID {
    return this.props.boardId;
  }

  get columnId(): UniqueEntityID {
    return this.props.columnId;
  }

  set columnId(columnId: UniqueEntityID) {
    this.props.columnId = columnId;
    this.touch();
  }

  get parentCardId(): UniqueEntityID | null {
    return this.props.parentCardId ?? null;
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

  get status(): string {
    return this.props.status;
  }

  set status(status: string) {
    this.props.status = status;
    this.touch();
  }

  get priority(): string {
    return this.props.priority;
  }

  set priority(priority: string) {
    this.props.priority = priority;
    this.touch();
  }

  get position(): number {
    return this.props.position;
  }

  set position(position: number) {
    this.props.position = position;
    this.touch();
  }

  get assigneeId(): UniqueEntityID | null {
    return this.props.assigneeId ?? null;
  }

  set assigneeId(assigneeId: UniqueEntityID | null) {
    this.props.assigneeId = assigneeId;
    this.touch();
  }

  get reporterId(): UniqueEntityID {
    return this.props.reporterId;
  }

  get startDate(): Date | null {
    return this.props.startDate ?? null;
  }

  set startDate(startDate: Date | null) {
    this.props.startDate = startDate;
    this.touch();
  }

  get dueDate(): Date | null {
    return this.props.dueDate ?? null;
  }

  set dueDate(dueDate: Date | null) {
    this.props.dueDate = dueDate;
    this.touch();
  }

  get completedAt(): Date | null {
    return this.props.completedAt ?? null;
  }

  get estimatedMinutes(): number | null {
    return this.props.estimatedMinutes ?? null;
  }

  set estimatedMinutes(estimatedMinutes: number | null) {
    this.props.estimatedMinutes = estimatedMinutes;
    this.touch();
  }

  get coverColor(): string | null {
    return this.props.coverColor ?? null;
  }

  set coverColor(coverColor: string | null) {
    this.props.coverColor = coverColor;
    this.touch();
  }

  get coverImageId(): string | null {
    return this.props.coverImageId ?? null;
  }

  set coverImageId(coverImageId: string | null) {
    this.props.coverImageId = coverImageId;
    this.touch();
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata ?? null;
  }

  set metadata(metadata: Record<string, unknown> | null) {
    this.props.metadata = metadata;
    this.touch();
  }

  get systemSourceType(): string | null {
    return this.props.systemSourceType ?? null;
  }

  get systemSourceId(): string | null {
    return this.props.systemSourceId ?? null;
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

  get isSubtask(): boolean {
    return !!this.props.parentCardId;
  }

  get isSystemCard(): boolean {
    return !!this.props.systemSourceType && !!this.props.systemSourceId;
  }

  get isCompleted(): boolean {
    return this.props.status === 'DONE';
  }

  get isCanceled(): boolean {
    return this.props.status === 'CANCELED';
  }

  get isArchived(): boolean {
    return !!this.props.archivedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get isOverdue(): boolean {
    return (
      !!this.props.dueDate &&
      !this.isCompleted &&
      this.props.dueDate < new Date()
    );
  }

  complete(): void {
    this.props.status = 'DONE';
    this.props.completedAt = new Date();
    this.touch();
  }

  cancel(): void {
    this.props.status = 'CANCELED';
    this.touch();
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
    props: Omit<CardProps, 'createdAt' | 'status' | 'priority' | 'position'> & {
      createdAt?: Date;
      status?: string;
      priority?: string;
      position?: number;
    },
    id?: UniqueEntityID,
  ): Card {
    return new Card(
      {
        ...props,
        status: props.status ?? 'OPEN',
        priority: props.priority ?? 'NONE',
        position: props.position ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
