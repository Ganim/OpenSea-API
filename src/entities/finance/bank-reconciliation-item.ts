import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ReconciliationMatchStatus =
  | 'UNMATCHED'
  | 'AUTO_MATCHED'
  | 'MANUAL_MATCHED'
  | 'IGNORED'
  | 'CREATED';

export interface BankReconciliationItemProps {
  id: UniqueEntityID;
  reconciliationId: UniqueEntityID;
  fitId: string;
  transactionDate: Date;
  amount: number;
  description: string;
  type: 'DEBIT' | 'CREDIT';
  matchedEntryId?: UniqueEntityID;
  matchConfidence?: number;
  matchStatus: ReconciliationMatchStatus;
  createdAt: Date;
}

export class BankReconciliationItem extends Entity<BankReconciliationItemProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get reconciliationId(): UniqueEntityID {
    return this.props.reconciliationId;
  }
  get fitId(): string {
    return this.props.fitId;
  }
  get transactionDate(): Date {
    return this.props.transactionDate;
  }
  get amount(): number {
    return this.props.amount;
  }
  get description(): string {
    return this.props.description;
  }
  get type(): 'DEBIT' | 'CREDIT' {
    return this.props.type;
  }
  get matchedEntryId(): UniqueEntityID | undefined {
    return this.props.matchedEntryId;
  }
  get matchConfidence(): number | undefined {
    return this.props.matchConfidence;
  }
  get matchStatus(): ReconciliationMatchStatus {
    return this.props.matchStatus;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isMatched(): boolean {
    return (
      this.props.matchStatus === 'AUTO_MATCHED' ||
      this.props.matchStatus === 'MANUAL_MATCHED'
    );
  }

  get isUnmatched(): boolean {
    return this.props.matchStatus === 'UNMATCHED';
  }

  autoMatch(entryId: UniqueEntityID, confidence: number): void {
    this.props.matchedEntryId = entryId;
    this.props.matchConfidence = confidence;
    this.props.matchStatus = 'AUTO_MATCHED';
  }

  manualMatch(entryId: UniqueEntityID): void {
    this.props.matchedEntryId = entryId;
    this.props.matchConfidence = 1.0;
    this.props.matchStatus = 'MANUAL_MATCHED';
  }

  ignore(): void {
    this.props.matchStatus = 'IGNORED';
    this.props.matchedEntryId = undefined;
    this.props.matchConfidence = undefined;
  }

  markAsCreated(entryId: UniqueEntityID): void {
    this.props.matchedEntryId = entryId;
    this.props.matchConfidence = 1.0;
    this.props.matchStatus = 'CREATED';
  }

  static create(
    props: Optional<
      BankReconciliationItemProps,
      'id' | 'createdAt' | 'matchStatus'
    >,
    id?: UniqueEntityID,
  ): BankReconciliationItem {
    return new BankReconciliationItem(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        matchStatus: props.matchStatus ?? 'UNMATCHED',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
