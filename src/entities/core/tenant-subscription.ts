import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantSubscriptionProps {
  id: UniqueEntityID;
  tenantId: string;
  skillCode: string;
  status: string;
  quantity: number;
  startsAt: Date;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  customPrice: number | null;
  discountPercent: number | null;
  notes: string | null;
  grantedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date | null;
}

export class TenantSubscription extends Entity<TenantSubscriptionProps> {
  get tenantSubscriptionId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get skillCode(): string {
    return this.props.skillCode;
  }
  get status(): string {
    return this.props.status;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get startsAt(): Date {
    return this.props.startsAt;
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }
  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }
  get customPrice(): number | null {
    return this.props.customPrice;
  }
  get discountPercent(): number | null {
    return this.props.discountPercent;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get grantedBy(): string | null {
    return this.props.grantedBy;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  set status(status: string) {
    this.props.status = status;
    this.touch();
  }
  set quantity(quantity: number) {
    this.props.quantity = quantity;
    this.touch();
  }
  set expiresAt(expiresAt: Date | null) {
    this.props.expiresAt = expiresAt;
    this.touch();
  }
  set cancelledAt(cancelledAt: Date | null) {
    this.props.cancelledAt = cancelledAt;
    this.touch();
  }
  set customPrice(customPrice: number | null) {
    this.props.customPrice = customPrice;
    this.touch();
  }
  set discountPercent(discountPercent: number | null) {
    this.props.discountPercent = discountPercent;
    this.touch();
  }
  set notes(notes: string | null) {
    this.props.notes = notes;
    this.touch();
  }
  set metadata(metadata: Record<string, unknown>) {
    this.props.metadata = metadata;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TenantSubscriptionProps,
      | 'id'
      | 'status'
      | 'quantity'
      | 'startsAt'
      | 'expiresAt'
      | 'cancelledAt'
      | 'customPrice'
      | 'discountPercent'
      | 'notes'
      | 'grantedBy'
      | 'metadata'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): TenantSubscription {
    const subscriptionId = id ?? props.id ?? new UniqueEntityID();
    return new TenantSubscription(
      {
        ...props,
        id: subscriptionId,
        status: props.status ?? 'ACTIVE',
        quantity: props.quantity ?? 1,
        startsAt: props.startsAt ?? new Date(),
        expiresAt: props.expiresAt ?? null,
        cancelledAt: props.cancelledAt ?? null,
        customPrice: props.customPrice ?? null,
        discountPercent: props.discountPercent ?? null,
        notes: props.notes ?? null,
        grantedBy: props.grantedBy ?? null,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      subscriptionId,
    );
  }
}
