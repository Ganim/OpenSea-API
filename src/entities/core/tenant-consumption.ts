import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantConsumptionProps {
  id: UniqueEntityID;
  tenantId: string;
  period: string;
  metric: string;
  quantity: number;
  limit: number | null;
  used: number;
  included: number;
  overage: number;
  overageCost: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export class TenantConsumption extends Entity<TenantConsumptionProps> {
  get tenantConsumptionId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get period(): string {
    return this.props.period;
  }
  get metric(): string {
    return this.props.metric;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get limit(): number | null {
    return this.props.limit;
  }
  get used(): number {
    return this.props.used;
  }
  get included(): number {
    return this.props.included;
  }
  get overage(): number {
    return this.props.overage;
  }
  get overageCost(): number {
    return this.props.overageCost;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  set quantity(quantity: number) {
    this.props.quantity = quantity;
    this.touch();
  }
  set limit(limit: number | null) {
    this.props.limit = limit;
    this.touch();
  }
  set used(used: number) {
    this.props.used = used;
    this.touch();
  }
  set included(included: number) {
    this.props.included = included;
    this.touch();
  }
  set overage(overage: number) {
    this.props.overage = overage;
    this.touch();
  }
  set overageCost(overageCost: number) {
    this.props.overageCost = overageCost;
    this.touch();
  }

  incrementUsage(amount: number): void {
    this.props.used += amount;
    this.props.overage = Math.max(0, this.props.used - this.props.included);
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TenantConsumptionProps,
      | 'id'
      | 'quantity'
      | 'limit'
      | 'used'
      | 'included'
      | 'overage'
      | 'overageCost'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): TenantConsumption {
    const consumptionId = id ?? props.id ?? new UniqueEntityID();
    return new TenantConsumption(
      {
        ...props,
        id: consumptionId,
        quantity: props.quantity ?? 0,
        limit: props.limit ?? null,
        used: props.used ?? 0,
        included: props.included ?? 0,
        overage: props.overage ?? 0,
        overageCost: props.overageCost ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      consumptionId,
    );
  }
}
