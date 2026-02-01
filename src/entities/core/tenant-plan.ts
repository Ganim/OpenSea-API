import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantPlanProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  planId: UniqueEntityID;
  startsAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantPlan extends Entity<TenantPlanProps> {
  get tenantPlanId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get planId(): UniqueEntityID {
    return this.props.planId;
  }
  get startsAt(): Date {
    return this.props.startsAt;
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isExpired(): boolean {
    return this.expiresAt !== null && this.expiresAt < new Date();
  }

  set planId(planId: UniqueEntityID) {
    this.props.planId = planId;
    this.touch();
  }
  set startsAt(startsAt: Date) {
    this.props.startsAt = startsAt;
    this.touch();
  }
  set expiresAt(expiresAt: Date | null) {
    this.props.expiresAt = expiresAt;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TenantPlanProps,
      'id' | 'createdAt' | 'updatedAt' | 'startsAt' | 'expiresAt'
    >,
    id?: UniqueEntityID,
  ): TenantPlan {
    const tpId = id ?? props.id ?? new UniqueEntityID();
    return new TenantPlan(
      {
        ...props,
        id: tpId,
        startsAt: props.startsAt ?? new Date(),
        expiresAt: props.expiresAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      tpId,
    );
  }
}
