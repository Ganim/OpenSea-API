import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface BankAccountProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  companyId: UniqueEntityID;
  name: string;
  bankCode: string;
  bankName?: string;
  agency: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit?: string;
  accountType: string;
  status: string;
  pixKeyType?: string;
  pixKey?: string;
  currentBalance: number;
  balanceUpdatedAt?: Date;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class BankAccount extends Entity<BankAccountProps> {
  get id(): UniqueEntityID { return this.props.id; }
  get tenantId(): UniqueEntityID { return this.props.tenantId; }

  get companyId(): UniqueEntityID { return this.props.companyId; }

  get name(): string { return this.props.name; }
  set name(value: string) { this.props.name = value; this.touch(); }

  get bankCode(): string { return this.props.bankCode; }
  set bankCode(value: string) { this.props.bankCode = value; this.touch(); }

  get bankName(): string | undefined { return this.props.bankName; }
  set bankName(value: string | undefined) { this.props.bankName = value; this.touch(); }

  get agency(): string { return this.props.agency; }
  set agency(value: string) { this.props.agency = value; this.touch(); }

  get agencyDigit(): string | undefined { return this.props.agencyDigit; }
  set agencyDigit(value: string | undefined) { this.props.agencyDigit = value; this.touch(); }

  get accountNumber(): string { return this.props.accountNumber; }
  set accountNumber(value: string) { this.props.accountNumber = value; this.touch(); }

  get accountDigit(): string | undefined { return this.props.accountDigit; }
  set accountDigit(value: string | undefined) { this.props.accountDigit = value; this.touch(); }

  get accountType(): string { return this.props.accountType; }
  set accountType(value: string) { this.props.accountType = value; this.touch(); }

  get status(): string { return this.props.status; }
  set status(value: string) { this.props.status = value; this.touch(); }

  get pixKeyType(): string | undefined { return this.props.pixKeyType; }
  set pixKeyType(value: string | undefined) { this.props.pixKeyType = value; this.touch(); }

  get pixKey(): string | undefined { return this.props.pixKey; }
  set pixKey(value: string | undefined) { this.props.pixKey = value; this.touch(); }

  get currentBalance(): number { return this.props.currentBalance; }
  set currentBalance(value: number) { this.props.currentBalance = value; this.touch(); }

  get balanceUpdatedAt(): Date | undefined { return this.props.balanceUpdatedAt; }

  get color(): string | undefined { return this.props.color; }
  set color(value: string | undefined) { this.props.color = value; this.touch(); }

  get isDefault(): boolean { return this.props.isDefault; }
  set isDefault(value: boolean) { this.props.isDefault = value; this.touch(); }

  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }

  get isDeleted(): boolean { return !!this.props.deletedAt; }
  get isActive(): boolean { return this.props.status === 'ACTIVE'; }

  get displayAccount(): string {
    const digit = this.props.accountDigit ? `-${this.props.accountDigit}` : '';
    return `${this.props.accountNumber}${digit}`;
  }

  get displayAgency(): string {
    const digit = this.props.agencyDigit ? `-${this.props.agencyDigit}` : '';
    return `${this.props.agency}${digit}`;
  }

  close(): void { this.status = 'CLOSED'; }
  inactivate(): void { this.status = 'INACTIVE'; }
  activate(): void { this.status = 'ACTIVE'; }
  delete(): void { this.props.deletedAt = new Date(); this.touch(); }
  restore(): void { this.props.deletedAt = undefined; this.touch(); }

  private touch(): void { this.props.updatedAt = new Date(); }

  static create(
    props: Optional<BankAccountProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'status' | 'currentBalance' | 'isDefault'>,
    id?: UniqueEntityID,
  ): BankAccount {
    return new BankAccount({
      ...props,
      id: id ?? new UniqueEntityID(),
      status: props.status ?? 'ACTIVE',
      currentBalance: props.currentBalance ?? 0,
      isDefault: props.isDefault ?? false,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    }, id);
  }
}
