import { Entity } from '../domain/entities';
import type { UniqueEntityID } from '../domain/unique-entity-id';

export type EntryLineType = 'DEBIT' | 'CREDIT';

interface JournalEntryLineProps {
  journalEntryId: UniqueEntityID;
  chartOfAccountId: UniqueEntityID;
  type: EntryLineType;
  amount: number;
  description?: string;
}

export class JournalEntryLine extends Entity<JournalEntryLineProps> {
  get journalEntryId() {
    return this.props.journalEntryId;
  }
  get chartOfAccountId() {
    return this.props.chartOfAccountId;
  }
  get type() {
    return this.props.type;
  }
  get amount() {
    return this.props.amount;
  }
  get description() {
    return this.props.description;
  }

  static create(props: JournalEntryLineProps, id?: UniqueEntityID) {
    return new JournalEntryLine(props, id);
  }
}
