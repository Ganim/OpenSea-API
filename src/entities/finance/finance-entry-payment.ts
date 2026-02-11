import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FinanceEntryPaymentProps {
  id: UniqueEntityID;
  entryId: UniqueEntityID;
  bankAccountId?: UniqueEntityID;
  amount: number;
  paidAt: Date;
  method?: string;
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
  get method(): string | undefined {
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

  static create(
    props: Optional<FinanceEntryPaymentProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): FinanceEntryPayment {
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
