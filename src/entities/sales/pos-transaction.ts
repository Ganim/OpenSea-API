import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PosTransactionStatus =
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'PENDING_SYNC';

export interface PosTransactionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  sessionId: UniqueEntityID;
  orderId: UniqueEntityID;
  transactionNumber: number;
  status: PosTransactionStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  changeAmount: number;
  customerId?: UniqueEntityID;
  customerName?: string;
  customerDocument?: string;
  overrideByUserId?: UniqueEntityID;
  overrideReason?: string;
  syncedAt?: Date;
  createdAt: Date;
}

export class PosTransaction extends Entity<PosTransactionProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get sessionId() {
    return this.props.sessionId;
  }
  get orderId() {
    return this.props.orderId;
  }
  get transactionNumber() {
    return this.props.transactionNumber;
  }
  get status() {
    return this.props.status;
  }
  set status(value: PosTransactionStatus) {
    this.props.status = value;
  }
  get subtotal() {
    return this.props.subtotal;
  }
  get discountTotal() {
    return this.props.discountTotal;
  }
  get taxTotal() {
    return this.props.taxTotal;
  }
  get grandTotal() {
    return this.props.grandTotal;
  }
  get changeAmount() {
    return this.props.changeAmount;
  }
  get customerId() {
    return this.props.customerId;
  }
  get customerName() {
    return this.props.customerName;
  }
  get customerDocument() {
    return this.props.customerDocument;
  }
  get overrideByUserId() {
    return this.props.overrideByUserId;
  }
  get overrideReason() {
    return this.props.overrideReason;
  }
  get syncedAt() {
    return this.props.syncedAt;
  }
  set syncedAt(value: Date | undefined) {
    this.props.syncedAt = value;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<
      PosTransactionProps,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'discountTotal'
      | 'taxTotal'
      | 'changeAmount'
    >,
    id?: UniqueEntityID,
  ) {
    return new PosTransaction(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        status: props.status ?? 'COMPLETED',
        discountTotal: props.discountTotal ?? 0,
        taxTotal: props.taxTotal ?? 0,
        changeAmount: props.changeAmount ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
