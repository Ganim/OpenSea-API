import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface InterviewProps {
  tenantId: UniqueEntityID;
  applicationId: UniqueEntityID;
  interviewStageId: UniqueEntityID;
  interviewerId: UniqueEntityID;
  scheduledAt: Date;
  duration: number;
  location?: string;
  meetingUrl?: string;
  status: string;
  feedback?: string;
  rating?: number;
  recommendation?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Interview extends Entity<InterviewProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get applicationId(): UniqueEntityID {
    return this.props.applicationId;
  }

  get interviewStageId(): UniqueEntityID {
    return this.props.interviewStageId;
  }

  get interviewerId(): UniqueEntityID {
    return this.props.interviewerId;
  }

  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }

  get duration(): number {
    return this.props.duration;
  }

  get location(): string | undefined {
    return this.props.location;
  }

  get meetingUrl(): string | undefined {
    return this.props.meetingUrl;
  }

  get status(): string {
    return this.props.status;
  }

  get feedback(): string | undefined {
    return this.props.feedback;
  }

  get rating(): number | undefined {
    return this.props.rating;
  }

  get recommendation(): string | undefined {
    return this.props.recommendation;
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

  complete(feedback: string, rating: number, recommendation: string): void {
    this.props.status = 'COMPLETED';
    this.props.feedback = feedback;
    this.props.rating = rating;
    this.props.recommendation = recommendation;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  markNoShow(): void {
    this.props.status = 'NO_SHOW';
    this.props.updatedAt = new Date();
  }

  private constructor(props: InterviewProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<InterviewProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Interview {
    const now = new Date();

    return new Interview(
      {
        ...props,
        status: props.status ?? 'SCHEDULED',
        duration: props.duration ?? 60,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
