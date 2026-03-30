import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PerformanceReviewProps {
  tenantId: UniqueEntityID;
  reviewCycleId: UniqueEntityID;
  employeeId: UniqueEntityID;
  reviewerId: UniqueEntityID;
  status: string;
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  selfComments?: string;
  managerComments?: string;
  strengths?: string;
  improvements?: string;
  goals?: string;
  employeeAcknowledged: boolean;
  acknowledgedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PerformanceReview extends Entity<PerformanceReviewProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get reviewCycleId(): UniqueEntityID {
    return this.props.reviewCycleId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get reviewerId(): UniqueEntityID {
    return this.props.reviewerId;
  }

  get status(): string {
    return this.props.status;
  }

  get selfScore(): number | undefined {
    return this.props.selfScore;
  }

  get managerScore(): number | undefined {
    return this.props.managerScore;
  }

  get finalScore(): number | undefined {
    return this.props.finalScore;
  }

  get selfComments(): string | undefined {
    return this.props.selfComments;
  }

  get managerComments(): string | undefined {
    return this.props.managerComments;
  }

  get strengths(): string | undefined {
    return this.props.strengths;
  }

  get improvements(): string | undefined {
    return this.props.improvements;
  }

  get goals(): string | undefined {
    return this.props.goals;
  }

  get employeeAcknowledged(): boolean {
    return this.props.employeeAcknowledged;
  }

  get acknowledgedAt(): Date | undefined {
    return this.props.acknowledgedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  isSelfAssessment(): boolean {
    return this.props.status === 'SELF_ASSESSMENT';
  }

  isManagerReview(): boolean {
    return this.props.status === 'MANAGER_REVIEW';
  }

  isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  submitSelfAssessment(
    selfScore: number,
    selfComments?: string,
    strengths?: string,
    improvements?: string,
    goals?: string,
  ): void {
    this.props.selfScore = selfScore;
    if (selfComments !== undefined) this.props.selfComments = selfComments;
    if (strengths !== undefined) this.props.strengths = strengths;
    if (improvements !== undefined) this.props.improvements = improvements;
    if (goals !== undefined) this.props.goals = goals;
    this.props.status = 'MANAGER_REVIEW';
    this.props.updatedAt = new Date();
  }

  submitManagerReview(
    managerScore: number,
    managerComments?: string,
    strengths?: string,
    improvements?: string,
    goals?: string,
  ): void {
    this.props.managerScore = managerScore;
    if (managerComments !== undefined)
      this.props.managerComments = managerComments;
    if (strengths !== undefined) this.props.strengths = strengths;
    if (improvements !== undefined) this.props.improvements = improvements;
    if (goals !== undefined) this.props.goals = goals;
    this.props.finalScore = this.calculateFinalScore();
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  acknowledge(): void {
    this.props.employeeAcknowledged = true;
    this.props.acknowledgedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private calculateFinalScore(): number {
    const selfWeight = 0.3;
    const managerWeight = 0.7;

    if (this.props.selfScore && this.props.managerScore) {
      return Number(
        (
          this.props.selfScore * selfWeight +
          this.props.managerScore * managerWeight
        ).toFixed(2),
      );
    }

    return this.props.managerScore ?? this.props.selfScore ?? 0;
  }

  private constructor(props: PerformanceReviewProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<PerformanceReviewProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): PerformanceReview {
    const now = new Date();

    return new PerformanceReview(
      {
        ...props,
        status: props.status ?? 'PENDING',
        employeeAcknowledged: props.employeeAcknowledged ?? false,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
