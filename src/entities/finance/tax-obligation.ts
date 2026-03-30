import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { Optional } from '../domain/optional';

export type TaxObligationStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type TaxType = 'IRRF' | 'ISS' | 'INSS' | 'PIS' | 'COFINS' | 'CSLL';

export interface TaxObligationProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  taxType: TaxType;
  referenceMonth: number;
  referenceYear: number;
  dueDate: Date;
  amount: number;
  status: TaxObligationStatus;
  paidAt?: Date;
  darfCode?: string;
  entryId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class TaxObligation extends Entity<TaxObligationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get taxType(): TaxType {
    return this.props.taxType;
  }

  get referenceMonth(): number {
    return this.props.referenceMonth;
  }

  get referenceYear(): number {
    return this.props.referenceYear;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get amount(): number {
    return this.props.amount;
  }
  set amount(value: number) {
    this.props.amount = value;
    this.touch();
  }

  get status(): TaxObligationStatus {
    return this.props.status;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  get darfCode(): string | undefined {
    return this.props.darfCode;
  }

  get entryId(): string | undefined {
    return this.props.entryId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  get isOverdue(): boolean {
    if (this.props.status === 'PAID' || this.props.status === 'CANCELLED') {
      return false;
    }
    return new Date() > this.props.dueDate;
  }

  get referencePeriod(): string {
    const month = String(this.props.referenceMonth).padStart(2, '0');
    return `${month}/${this.props.referenceYear}`;
  }

  markAsPaid(paidAt: Date, entryId?: string): void {
    this.props.status = 'PAID';
    this.props.paidAt = paidAt;
    if (entryId) {
      this.props.entryId = entryId;
    }
    this.touch();
  }

  markAsOverdue(): void {
    this.props.status = 'OVERDUE';
    this.touch();
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TaxObligationProps,
      'id' | 'createdAt' | 'updatedAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): TaxObligation {
    return new TaxObligation(
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
