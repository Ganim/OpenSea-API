import { Entity } from '../domain/entities';
import type { UniqueEntityID } from '../domain/unique-entity-id';

export type JournalSourceType = 'FINANCE_ENTRY' | 'FINANCE_PAYMENT' | 'MANUAL';
export type JournalStatus = 'POSTED' | 'REVERSED';

interface JournalEntryProps {
  tenantId: UniqueEntityID;
  code: string;
  date: Date;
  description: string;
  sourceType: JournalSourceType;
  sourceId?: string;
  status: JournalStatus;
  reversedById?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class JournalEntry extends Entity<JournalEntryProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get code() {
    return this.props.code;
  }
  get date() {
    return this.props.date;
  }
  get description() {
    return this.props.description;
  }
  get sourceType() {
    return this.props.sourceType;
  }
  get sourceId() {
    return this.props.sourceId;
  }
  get status() {
    return this.props.status;
  }
  get reversedById() {
    return this.props.reversedById;
  }
  get createdBy() {
    return this.props.createdBy;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  set status(value: JournalStatus) {
    this.props.status = value;
  }
  set reversedById(value: string | undefined) {
    this.props.reversedById = value;
  }

  reverse(reversalId: string) {
    this.props.status = 'REVERSED';
    this.props.reversedById = reversalId;
  }

  static create(props: JournalEntryProps, id?: UniqueEntityID) {
    return new JournalEntry(props, id);
  }
}
