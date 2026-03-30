import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface InterviewStageProps {
  tenantId: UniqueEntityID;
  jobPostingId: UniqueEntityID;
  name: string;
  order: number;
  type: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InterviewStage extends Entity<InterviewStageProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get jobPostingId(): UniqueEntityID {
    return this.props.jobPostingId;
  }

  get name(): string {
    return this.props.name;
  }

  get order(): number {
    return this.props.order;
  }

  get type(): string {
    return this.props.type;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateOrder(order: number): void {
    this.props.order = order;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Interview stage name cannot be empty');
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  private constructor(props: InterviewStageProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<InterviewStageProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): InterviewStage {
    const now = new Date();

    return new InterviewStage(
      {
        ...props,
        type: props.type ?? 'SCREENING',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
