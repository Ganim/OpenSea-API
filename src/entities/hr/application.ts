import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ApplicationProps {
  tenantId: UniqueEntityID;
  jobPostingId: UniqueEntityID;
  candidateId: UniqueEntityID;
  status: string;
  currentStageId?: UniqueEntityID;
  appliedAt: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  hiredAt?: Date;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Application extends Entity<ApplicationProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get jobPostingId(): UniqueEntityID {
    return this.props.jobPostingId;
  }

  get candidateId(): UniqueEntityID {
    return this.props.candidateId;
  }

  get status(): string {
    return this.props.status;
  }

  get currentStageId(): UniqueEntityID | undefined {
    return this.props.currentStageId;
  }

  get appliedAt(): Date {
    return this.props.appliedAt;
  }

  get rejectedAt(): Date | undefined {
    return this.props.rejectedAt;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get hiredAt(): Date | undefined {
    return this.props.hiredAt;
  }

  get rating(): number | undefined {
    return this.props.rating;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  advanceToStage(stageId: UniqueEntityID): void {
    this.props.currentStageId = stageId;
    this.props.updatedAt = new Date();
  }

  reject(reason?: string): void {
    this.props.status = 'REJECTED';
    this.props.rejectedAt = new Date();
    this.props.rejectionReason = reason;
    this.props.updatedAt = new Date();
  }

  hire(): void {
    this.props.status = 'HIRED';
    this.props.hiredAt = new Date();
    this.props.updatedAt = new Date();
  }

  withdraw(): void {
    this.props.status = 'WITHDRAWN';
    this.props.updatedAt = new Date();
  }

  updateStatus(status: string): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  setRating(rating: number): void {
    this.props.rating = rating;
    this.props.updatedAt = new Date();
  }

  private constructor(props: ApplicationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<ApplicationProps, 'createdAt' | 'updatedAt' | 'appliedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
      appliedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Application {
    const now = new Date();

    return new Application(
      {
        ...props,
        status: props.status ?? 'APPLIED',
        appliedAt: props.appliedAt ?? now,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
