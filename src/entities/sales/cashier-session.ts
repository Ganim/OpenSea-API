import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CashierSessionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  cashierId: string;
  posTerminalId?: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  notes?: string;
  createdAt: Date;
}

export class CashierSession extends Entity<CashierSessionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get cashierId(): string {
    return this.props.cashierId;
  }

  get posTerminalId(): string | undefined {
    return this.props.posTerminalId;
  }

  get openedAt(): Date {
    return this.props.openedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  set closedAt(value: Date | undefined) {
    this.props.closedAt = value;
  }

  get openingBalance(): number {
    return this.props.openingBalance;
  }

  get closingBalance(): number | undefined {
    return this.props.closingBalance;
  }

  set closingBalance(value: number | undefined) {
    this.props.closingBalance = value;
  }

  get expectedBalance(): number | undefined {
    return this.props.expectedBalance;
  }

  set expectedBalance(value: number | undefined) {
    this.props.expectedBalance = value;
  }

  get difference(): number | undefined {
    return this.props.difference;
  }

  set difference(value: number | undefined) {
    this.props.difference = value;
  }

  get status(): 'OPEN' | 'CLOSED' | 'RECONCILED' {
    return this.props.status;
  }

  set status(value: 'OPEN' | 'CLOSED' | 'RECONCILED') {
    this.props.status = value;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  close(closingBalance: number, expectedBalance: number) {
    this.props.status = 'CLOSED';
    this.props.closedAt = new Date();
    this.props.closingBalance = closingBalance;
    this.props.expectedBalance = expectedBalance;
    this.props.difference = closingBalance - expectedBalance;
  }

  reconcile() {
    this.props.status = 'RECONCILED';
  }

  static create(
    props: Optional<
      CashierSessionProps,
      'id' | 'createdAt' | 'openedAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): CashierSession {
    const session = new CashierSession(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'OPEN',
        openedAt: props.openedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return session;
  }
}
