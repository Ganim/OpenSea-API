import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ReviewCycleProps {
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ReviewCycle extends Entity<ReviewCycleProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): string {
    return this.props.type;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get status(): string {
    return this.props.status;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  open(): void {
    this.props.status = 'OPEN';
    this.props.updatedAt = new Date();
  }

  moveToInReview(): void {
    this.props.status = 'IN_REVIEW';
    this.props.updatedAt = new Date();
  }

  moveToCalibration(): void {
    this.props.status = 'CALIBRATION';
    this.props.updatedAt = new Date();
  }

  close(): void {
    this.props.status = 'CLOSED';
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Review cycle name cannot be empty');
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  private constructor(props: ReviewCycleProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<ReviewCycleProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): ReviewCycle {
    const now = new Date();

    return new ReviewCycle(
      {
        ...props,
        status: props.status ?? 'DRAFT',
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
