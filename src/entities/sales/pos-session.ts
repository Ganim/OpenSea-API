import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PosSessionStatus = 'OPEN' | 'CLOSED' | 'SUSPENDED';

export interface PosSessionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  terminalId: UniqueEntityID;
  operatorUserId: UniqueEntityID;
  status: PosSessionStatus;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  closingBreakdown?: Record<string, unknown>;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class PosSession extends Entity<PosSessionProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get terminalId() {
    return this.props.terminalId;
  }
  get operatorUserId() {
    return this.props.operatorUserId;
  }
  get status() {
    return this.props.status;
  }
  set status(value: PosSessionStatus) {
    this.props.status = value;
  }
  get openedAt() {
    return this.props.openedAt;
  }
  get closedAt() {
    return this.props.closedAt;
  }
  set closedAt(value: Date | undefined) {
    this.props.closedAt = value;
  }
  get openingBalance() {
    return this.props.openingBalance;
  }
  get closingBalance() {
    return this.props.closingBalance;
  }
  set closingBalance(value: number | undefined) {
    this.props.closingBalance = value;
  }
  get expectedBalance() {
    return this.props.expectedBalance;
  }
  set expectedBalance(value: number | undefined) {
    this.props.expectedBalance = value;
  }
  get difference() {
    return this.props.difference;
  }
  set difference(value: number | undefined) {
    this.props.difference = value;
  }
  get closingBreakdown() {
    return this.props.closingBreakdown;
  }
  set closingBreakdown(value: Record<string, unknown> | undefined) {
    this.props.closingBreakdown = value;
  }
  get notes() {
    return this.props.notes;
  }
  set notes(value: string | undefined) {
    this.props.notes = value;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<
      PosSessionProps,
      'id' | 'createdAt' | 'status' | 'openedAt' | 'openingBalance'
    >,
    id?: UniqueEntityID,
  ) {
    return new PosSession(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        status: props.status ?? 'OPEN',
        openedAt: props.openedAt ?? new Date(),
        openingBalance: props.openingBalance ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
