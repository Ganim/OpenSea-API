import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ConsortiumPaymentProps {
  id: UniqueEntityID;
  consortiumId: UniqueEntityID;
  bankAccountId?: UniqueEntityID;
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
  paidAmount?: number;
  paidAt?: Date;
  status: string; // PENDING | PAID | OVERDUE | CANCELLED
  createdAt: Date;
  updatedAt?: Date;
}

export class ConsortiumPayment extends Entity<ConsortiumPaymentProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get consortiumId(): UniqueEntityID {
    return this.props.consortiumId;
  }

  get bankAccountId(): UniqueEntityID | undefined {
    return this.props.bankAccountId;
  }
  set bankAccountId(value: UniqueEntityID | undefined) {
    this.props.bankAccountId = value;
    this.touch();
  }

  get installmentNumber(): number {
    return this.props.installmentNumber;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get expectedAmount(): number {
    return this.props.expectedAmount;
  }

  get paidAmount(): number | undefined {
    return this.props.paidAmount;
  }
  set paidAmount(value: number | undefined) {
    this.props.paidAmount = value;
    this.touch();
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }
  set paidAt(value: Date | undefined) {
    this.props.paidAt = value;
    this.touch();
  }

  get status(): string {
    return this.props.status;
  }
  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Computed getters
  get isPaid(): boolean {
    return this.props.status === 'PAID';
  }

  get isOverdue(): boolean {
    if (this.props.status === 'PAID') return false;
    return new Date() > this.props.dueDate;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ConsortiumPaymentProps,
      'id' | 'createdAt' | 'updatedAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): ConsortiumPayment {
    return new ConsortiumPayment(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
