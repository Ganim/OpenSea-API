import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ReturnType = 'FULL_RETURN' | 'PARTIAL_RETURN' | 'EXCHANGE';

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'RECEIVING'
  | 'RECEIVED'
  | 'CREDIT_ISSUED'
  | 'EXCHANGE_COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type ReturnReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'CHANGED_MIND'
  | 'DAMAGED'
  | 'NOT_AS_DESCRIBED'
  | 'OTHER';

export type RefundMethod =
  | 'SAME_METHOD'
  | 'STORE_CREDIT'
  | 'BANK_TRANSFER'
  | 'PIX';

export interface OrderReturnProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderId: UniqueEntityID;
  returnNumber: string;
  type: ReturnType;
  status: ReturnStatus;
  reason: ReturnReason;
  reasonDetails?: string;

  // Financial
  refundMethod?: RefundMethod;
  refundAmount: number;
  creditAmount: number;
  exchangeOrderId?: UniqueEntityID;

  // Approval
  requestedByUserId: UniqueEntityID;
  approvedByUserId?: UniqueEntityID;
  approvedAt?: Date;
  rejectedReason?: string;

  receivedAt?: Date;
  notes?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class OrderReturn extends Entity<OrderReturnProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get orderId(): UniqueEntityID {
    return this.props.orderId;
  }

  get returnNumber(): string {
    return this.props.returnNumber;
  }

  get type(): ReturnType {
    return this.props.type;
  }

  get status(): ReturnStatus {
    return this.props.status;
  }

  set status(value: ReturnStatus) {
    this.props.status = value;
    this.touch();
  }

  get reason(): ReturnReason {
    return this.props.reason;
  }

  get reasonDetails(): string | undefined {
    return this.props.reasonDetails;
  }

  get refundMethod(): RefundMethod | undefined {
    return this.props.refundMethod;
  }

  get refundAmount(): number {
    return this.props.refundAmount;
  }

  get creditAmount(): number {
    return this.props.creditAmount;
  }

  get exchangeOrderId(): UniqueEntityID | undefined {
    return this.props.exchangeOrderId;
  }

  get requestedByUserId(): UniqueEntityID {
    return this.props.requestedByUserId;
  }

  get approvedByUserId(): UniqueEntityID | undefined {
    return this.props.approvedByUserId;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get rejectedReason(): string | undefined {
    return this.props.rejectedReason;
  }

  get receivedAt(): Date | undefined {
    return this.props.receivedAt;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  approve(approvedByUserId: UniqueEntityID): void {
    this.props.status = 'APPROVED';
    this.props.approvedByUserId = approvedByUserId;
    this.props.approvedAt = new Date();
    this.touch();
  }

  reject(rejectedReason: string): void {
    this.props.status = 'REJECTED';
    this.props.rejectedReason = rejectedReason;
    this.touch();
  }

  markReceived(): void {
    this.props.status = 'RECEIVED';
    this.props.receivedAt = new Date();
    this.touch();
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      OrderReturnProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'status'
      | 'refundAmount'
      | 'creditAmount'
    >,
    id?: UniqueEntityID,
  ): OrderReturn {
    return new OrderReturn(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'REQUESTED',
        refundAmount: props.refundAmount ?? 0,
        creditAmount: props.creditAmount ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
