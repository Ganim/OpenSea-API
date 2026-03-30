import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PaymentMethod } from './finance-entry-types';

export interface FinanceEntryPaymentProps {
  id: UniqueEntityID;
  entryId: UniqueEntityID;
  bankAccountId?: UniqueEntityID;
  amount: number;
  paidAt: Date;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export class FinanceEntryPayment extends Entity<FinanceEntryPaymentProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get entryId(): UniqueEntityID {
    return this.props.entryId;
  }
  get bankAccountId(): UniqueEntityID | undefined {
    return this.props.bankAccountId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get paidAt(): Date {
    return this.props.paidAt;
  }
  get method(): PaymentMethod | undefined {
    return this.props.method;
  }
  get reference(): string | undefined {
    return this.props.reference;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get createdBy(): string | undefined {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  private static validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }
  }

  static create(
    props: Optional<FinanceEntryPaymentProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): FinanceEntryPayment {
    FinanceEntryPayment.validateAmount(props.amount);

    return new FinanceEntryPayment(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
