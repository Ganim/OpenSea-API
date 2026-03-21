import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantBillingProps {
  id: UniqueEntityID;
  tenantId: string;
  period: string;
  subscriptionTotal: number;
  consumptionTotal: number;
  discountsTotal: number;
  totalAmount: number;
  status: string;
  dueDate: Date;
  paidAt: Date | null;
  paymentMethod: string | null;
  invoiceUrl: string | null;
  lineItems: unknown[];
  notes: string | null;
  createdAt: Date;
}

export class TenantBilling extends Entity<TenantBillingProps> {
  get tenantBillingId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get period(): string {
    return this.props.period;
  }
  get subscriptionTotal(): number {
    return this.props.subscriptionTotal;
  }
  get consumptionTotal(): number {
    return this.props.consumptionTotal;
  }
  get discountsTotal(): number {
    return this.props.discountsTotal;
  }
  get totalAmount(): number {
    return this.props.totalAmount;
  }
  get status(): string {
    return this.props.status;
  }
  get dueDate(): Date {
    return this.props.dueDate;
  }
  get paidAt(): Date | null {
    return this.props.paidAt;
  }
  get paymentMethod(): string | null {
    return this.props.paymentMethod;
  }
  get invoiceUrl(): string | null {
    return this.props.invoiceUrl;
  }
  get lineItems(): unknown[] {
    return this.props.lineItems;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  set subscriptionTotal(subscriptionTotal: number) {
    this.props.subscriptionTotal = subscriptionTotal;
  }
  set consumptionTotal(consumptionTotal: number) {
    this.props.consumptionTotal = consumptionTotal;
  }
  set discountsTotal(discountsTotal: number) {
    this.props.discountsTotal = discountsTotal;
  }
  set totalAmount(totalAmount: number) {
    this.props.totalAmount = totalAmount;
  }
  set status(status: string) {
    this.props.status = status;
  }
  set paidAt(paidAt: Date | null) {
    this.props.paidAt = paidAt;
  }
  set paymentMethod(paymentMethod: string | null) {
    this.props.paymentMethod = paymentMethod;
  }
  set invoiceUrl(invoiceUrl: string | null) {
    this.props.invoiceUrl = invoiceUrl;
  }
  set lineItems(lineItems: unknown[]) {
    this.props.lineItems = lineItems;
  }
  set notes(notes: string | null) {
    this.props.notes = notes;
  }

  static create(
    props: Optional<
      TenantBillingProps,
      | 'id'
      | 'discountsTotal'
      | 'status'
      | 'paidAt'
      | 'paymentMethod'
      | 'invoiceUrl'
      | 'lineItems'
      | 'notes'
      | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): TenantBilling {
    const billingId = id ?? props.id ?? new UniqueEntityID();
    return new TenantBilling(
      {
        ...props,
        id: billingId,
        discountsTotal: props.discountsTotal ?? 0,
        status: props.status ?? 'PENDING',
        paidAt: props.paidAt ?? null,
        paymentMethod: props.paymentMethod ?? null,
        invoiceUrl: props.invoiceUrl ?? null,
        lineItems: props.lineItems ?? [],
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      billingId,
    );
  }
}
