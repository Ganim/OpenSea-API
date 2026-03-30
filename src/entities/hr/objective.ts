import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ObjectiveProps {
  tenantId: UniqueEntityID;
  title: string;
  description?: string;
  ownerId: UniqueEntityID;
  parentId?: UniqueEntityID;
  level: string;
  status: string;
  period: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Objective extends Entity<ObjectiveProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  get parentId(): UniqueEntityID | undefined {
    return this.props.parentId;
  }

  get level(): string {
    return this.props.level;
  }

  get status(): string {
    return this.props.status;
  }

  get period(): string {
    return this.props.period;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get progress(): number {
    return this.props.progress;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  activate(): void {
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  complete(): void {
    this.props.status = 'COMPLETED';
    this.props.progress = 100;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  updateProgress(progress: number): void {
    this.props.progress = Math.min(100, Math.max(0, progress));
    this.props.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  private constructor(props: ObjectiveProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<ObjectiveProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Objective {
    const now = new Date();

    return new Objective(
      {
        ...props,
        status: props.status ?? 'DRAFT',
        progress: props.progress ?? 0,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
