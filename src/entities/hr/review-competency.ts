import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ReviewCompetencyProps {
  tenantId: UniqueEntityID;
  reviewId: UniqueEntityID;
  name: string;
  selfScore?: number;
  managerScore?: number;
  weight: number;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ReviewCompetency extends Entity<ReviewCompetencyProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get reviewId(): UniqueEntityID {
    return this.props.reviewId;
  }

  get name(): string {
    return this.props.name;
  }

  get selfScore(): number | undefined {
    return this.props.selfScore;
  }

  get managerScore(): number | undefined {
    return this.props.managerScore;
  }

  get weight(): number {
    return this.props.weight;
  }

  get comments(): string | undefined {
    return this.props.comments;
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

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined && this.props.deletedAt !== null;
  }

  updateScores(input: {
    selfScore?: number | null;
    managerScore?: number | null;
    weight?: number;
    comments?: string | null;
    name?: string;
  }): void {
    if (input.selfScore !== undefined) {
      this.props.selfScore = input.selfScore ?? undefined;
    }
    if (input.managerScore !== undefined) {
      this.props.managerScore = input.managerScore ?? undefined;
    }
    if (input.weight !== undefined) {
      this.props.weight = input.weight;
    }
    if (input.comments !== undefined) {
      this.props.comments = input.comments ?? undefined;
    }
    if (input.name !== undefined) {
      this.props.name = input.name;
    }
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private constructor(props: ReviewCompetencyProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<
      ReviewCompetencyProps,
      'createdAt' | 'updatedAt' | 'weight'
    > & {
      weight?: number;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): ReviewCompetency {
    const now = new Date();

    return new ReviewCompetency(
      {
        ...props,
        weight: props.weight ?? 1.0,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}

export const DEFAULT_REVIEW_COMPETENCIES: readonly string[] = [
  'Técnica',
  'Comunicação',
  'Liderança',
  'Ownership',
  'Entrega',
] as const;
