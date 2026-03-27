import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ReconciliationSuggestionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

export interface ReconciliationSuggestionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  transactionId: UniqueEntityID;
  entryId: UniqueEntityID;
  score: number;
  matchReasons: string[];
  status: ReconciliationSuggestionStatus;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
}

export class ReconciliationSuggestion extends Entity<ReconciliationSuggestionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get transactionId(): UniqueEntityID {
    return this.props.transactionId;
  }

  get entryId(): UniqueEntityID {
    return this.props.entryId;
  }

  get score(): number {
    return this.props.score;
  }

  get matchReasons(): string[] {
    return this.props.matchReasons;
  }

  get status(): ReconciliationSuggestionStatus {
    return this.props.status;
  }

  get reviewedAt(): Date | undefined {
    return this.props.reviewedAt;
  }

  get reviewedBy(): string | undefined {
    return this.props.reviewedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  accept(reviewedBy: string): void {
    this.props.status = 'ACCEPTED';
    this.props.reviewedAt = new Date();
    this.props.reviewedBy = reviewedBy;
  }

  reject(reviewedBy: string): void {
    this.props.status = 'REJECTED';
    this.props.reviewedAt = new Date();
    this.props.reviewedBy = reviewedBy;
  }

  static create(
    props: Optional<
      ReconciliationSuggestionProps,
      'id' | 'createdAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): ReconciliationSuggestion {
    return new ReconciliationSuggestion(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
