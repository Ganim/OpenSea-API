import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { BankReconciliationItem } from './bank-reconciliation-item';

export type ReconciliationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface BankReconciliationProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bankAccountId: UniqueEntityID;
  importDate: Date;
  fileName: string;
  periodStart: Date;
  periodEnd: Date;
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  status: ReconciliationStatus;
  createdAt: Date;
  updatedAt?: Date;
  items?: BankReconciliationItem[];
}

export class BankReconciliation extends Entity<BankReconciliationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get bankAccountId(): UniqueEntityID {
    return this.props.bankAccountId;
  }
  get importDate(): Date {
    return this.props.importDate;
  }
  get fileName(): string {
    return this.props.fileName;
  }
  get periodStart(): Date {
    return this.props.periodStart;
  }
  get periodEnd(): Date {
    return this.props.periodEnd;
  }
  get totalTransactions(): number {
    return this.props.totalTransactions;
  }
  get matchedCount(): number {
    return this.props.matchedCount;
  }
  set matchedCount(value: number) {
    this.props.matchedCount = value;
    this.touch();
  }
  get unmatchedCount(): number {
    return this.props.unmatchedCount;
  }
  set unmatchedCount(value: number) {
    this.props.unmatchedCount = value;
    this.touch();
  }
  get status(): ReconciliationStatus {
    return this.props.status;
  }
  set status(value: ReconciliationStatus) {
    this.props.status = value;
    this.touch();
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
  get items(): BankReconciliationItem[] | undefined {
    return this.props.items;
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING';
  }
  get isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  complete(): void {
    this.status = 'COMPLETED';
  }

  cancel(): void {
    this.status = 'CANCELLED';
  }

  updateCounts(matchedCount: number, unmatchedCount: number): void {
    this.props.matchedCount = matchedCount;
    this.props.unmatchedCount = unmatchedCount;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      BankReconciliationProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'matchedCount'
      | 'unmatchedCount'
      | 'importDate'
      | 'items'
    >,
    id?: UniqueEntityID,
  ): BankReconciliation {
    return new BankReconciliation(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        matchedCount: props.matchedCount ?? 0,
        unmatchedCount: props.unmatchedCount ?? 0,
        importDate: props.importDate ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
