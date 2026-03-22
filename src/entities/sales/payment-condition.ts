import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PaymentConditionType =
  | 'CASH'
  | 'INSTALLMENT'
  | 'CUSTOM'
  | 'CREDIT_LIMIT';
export type InterestType = 'SIMPLE' | 'COMPOUND';
export type PaymentConditionApplicable = 'ALL' | 'RETAIL' | 'WHOLESALE' | 'BID';

export interface PaymentConditionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  type: PaymentConditionType;
  installments: number;
  firstDueDays: number;
  intervalDays: number;
  downPaymentPercent?: number;
  interestRate?: number;
  interestType: InterestType;
  penaltyRate?: number;
  discountCash?: number;
  applicableTo: PaymentConditionApplicable;
  minOrderValue?: number;
  maxOrderValue?: number;
  isActive: boolean;
  isDefault: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class PaymentCondition extends Entity<PaymentConditionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get type(): PaymentConditionType {
    return this.props.type;
  }

  get installments(): number {
    return this.props.installments;
  }

  set installments(value: number) {
    this.props.installments = value;
    this.touch();
  }

  get firstDueDays(): number {
    return this.props.firstDueDays;
  }

  get intervalDays(): number {
    return this.props.intervalDays;
  }

  get downPaymentPercent(): number | undefined {
    return this.props.downPaymentPercent;
  }

  get interestRate(): number | undefined {
    return this.props.interestRate;
  }

  get interestType(): InterestType {
    return this.props.interestType;
  }

  get penaltyRate(): number | undefined {
    return this.props.penaltyRate;
  }

  get discountCash(): number | undefined {
    return this.props.discountCash;
  }

  get applicableTo(): PaymentConditionApplicable {
    return this.props.applicableTo;
  }

  get minOrderValue(): number | undefined {
    return this.props.minOrderValue;
  }

  get maxOrderValue(): number | undefined {
    return this.props.maxOrderValue;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  set isDefault(value: boolean) {
    this.props.isDefault = value;
    this.touch();
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

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      PaymentConditionProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'installments'
      | 'firstDueDays'
      | 'intervalDays'
      | 'interestType'
      | 'applicableTo'
      | 'isActive'
      | 'isDefault'
    >,
    id?: UniqueEntityID,
  ): PaymentCondition {
    return new PaymentCondition(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        installments: props.installments ?? 1,
        firstDueDays: props.firstDueDays ?? 0,
        intervalDays: props.intervalDays ?? 30,
        interestType: props.interestType ?? 'SIMPLE',
        applicableTo: props.applicableTo ?? 'ALL',
        isActive: props.isActive ?? true,
        isDefault: props.isDefault ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
