import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TimeBankProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  balance: number; // Saldo em horas (pode ser positivo ou negativo)
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TimeBank extends Entity<TimeBankProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get balance(): number {
    return this.props.balance;
  }

  get year(): number {
    return this.props.year;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  hasPositiveBalance(): boolean {
    return this.balance > 0;
  }

  hasNegativeBalance(): boolean {
    return this.balance < 0;
  }

  isZero(): boolean {
    return this.balance === 0;
  }

  credit(hours: number): void {
    if (hours <= 0) {
      throw new Error('Hours to credit must be positive');
    }
    this.props.balance += hours;
    this.props.updatedAt = new Date();
  }

  debit(hours: number): void {
    if (hours <= 0) {
      throw new Error('Hours to debit must be positive');
    }
    this.props.balance -= hours;
    this.props.updatedAt = new Date();
  }

  canDebit(hours: number): boolean {
    // Permite débito mesmo que fique negativo (depende da política da empresa)
    // Pode ser ajustado conforme regras de negócio
    return hours > 0;
  }

  adjust(newBalance: number): void {
    this.props.balance = newBalance;
    this.props.updatedAt = new Date();
  }

  private constructor(props: TimeBankProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<TimeBankProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): TimeBank {
    const now = new Date();
    return new TimeBank(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
