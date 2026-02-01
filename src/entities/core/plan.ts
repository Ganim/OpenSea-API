import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PlanTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface PlanProps {
  id: UniqueEntityID;
  name: string;
  tier: PlanTier;
  description: string | null;
  price: number;
  isActive: boolean;
  maxUsers: number;
  maxWarehouses: number;
  maxProducts: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Plan extends Entity<PlanProps> {
  get planId(): UniqueEntityID {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get tier(): PlanTier {
    return this.props.tier;
  }
  get description(): string | null {
    return this.props.description;
  }
  get price(): number {
    return this.props.price;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get maxUsers(): number {
    return this.props.maxUsers;
  }
  get maxWarehouses(): number {
    return this.props.maxWarehouses;
  }
  get maxProducts(): number {
    return this.props.maxProducts;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }
  set tier(tier: PlanTier) {
    this.props.tier = tier;
    this.touch();
  }
  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }
  set price(price: number) {
    this.props.price = price;
    this.touch();
  }
  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }
  set maxUsers(maxUsers: number) {
    this.props.maxUsers = maxUsers;
    this.touch();
  }
  set maxWarehouses(maxWarehouses: number) {
    this.props.maxWarehouses = maxWarehouses;
    this.touch();
  }
  set maxProducts(maxProducts: number) {
    this.props.maxProducts = maxProducts;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      PlanProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'description'
      | 'isActive'
      | 'tier'
      | 'price'
      | 'maxUsers'
      | 'maxWarehouses'
      | 'maxProducts'
    >,
    id?: UniqueEntityID,
  ): Plan {
    const planId = id ?? props.id ?? new UniqueEntityID();
    return new Plan(
      {
        ...props,
        id: planId,
        tier: props.tier ?? 'FREE',
        description: props.description ?? null,
        price: props.price ?? 0,
        isActive: props.isActive ?? true,
        maxUsers: props.maxUsers ?? 5,
        maxWarehouses: props.maxWarehouses ?? 1,
        maxProducts: props.maxProducts ?? 100,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      planId,
    );
  }
}
