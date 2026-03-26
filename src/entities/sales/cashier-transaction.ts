import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CashierTransactionProps {
  id: UniqueEntityID;
  sessionId: UniqueEntityID;
  type: 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT';
  amount: number;
  description?: string;
  paymentMethod?: string;
  referenceId?: string;
  createdAt: Date;
}

export class CashierTransaction extends Entity<CashierTransactionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get sessionId(): UniqueEntityID {
    return this.props.sessionId;
  }

  get type(): 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT' {
    return this.props.type;
  }

  get amount(): number {
    return this.props.amount;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get paymentMethod(): string | undefined {
    return this.props.paymentMethod;
  }

  get referenceId(): string | undefined {
    return this.props.referenceId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<CashierTransactionProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): CashierTransaction {
    const transaction = new CashierTransaction(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return transaction;
  }
}
