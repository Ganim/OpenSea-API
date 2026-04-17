import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TrainingEnrollmentProps {
  tenantId: UniqueEntityID;
  trainingProgramId: UniqueEntityID;
  employeeId: UniqueEntityID;
  status: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  /**
   * Certificate expiration. Populated by CompleteEnrollmentUseCase using
   * `program.validityMonths ?? 24`. The `check-training-expiry` cron scans
   * this column to notify employees + managers 30 days before expiry and to
   * send a "re-inscrição necessária" reminder once expired.
   */
  expirationDate?: Date;
  score?: number;
  certificateUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TrainingEnrollment extends Entity<TrainingEnrollmentProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get trainingProgramId(): UniqueEntityID {
    return this.props.trainingProgramId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get status(): string {
    return this.props.status;
  }

  get enrolledAt(): Date {
    return this.props.enrolledAt;
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get expirationDate(): Date | undefined {
    return this.props.expirationDate;
  }

  get score(): number | undefined {
    return this.props.score;
  }

  get certificateUrl(): string | undefined {
    return this.props.certificateUrl;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isEnrolled(): boolean {
    return this.props.status === 'ENROLLED';
  }

  isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  start(): void {
    this.props.status = 'IN_PROGRESS';
    this.props.startedAt = new Date();
    this.props.updatedAt = new Date();
  }

  complete(score?: number, certificateUrl?: string): void {
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    if (score !== undefined) this.props.score = score;
    if (certificateUrl) this.props.certificateUrl = certificateUrl;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  fail(score?: number): void {
    this.props.status = 'FAILED';
    this.props.completedAt = new Date();
    if (score !== undefined) this.props.score = score;
    this.props.updatedAt = new Date();
  }

  private constructor(props: TrainingEnrollmentProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<TrainingEnrollmentProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): TrainingEnrollment {
    const now = new Date();

    return new TrainingEnrollment(
      {
        ...props,
        status: props.status ?? 'ENROLLED',
        enrolledAt: props.enrolledAt ?? now,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
