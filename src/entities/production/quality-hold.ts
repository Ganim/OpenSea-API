import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type QualityHoldStatus = 'ACTIVE' | 'RELEASED' | 'SCRAPPED';

export interface ProductionQualityHoldProps {
  id: UniqueEntityID;
  productionOrderId: UniqueEntityID;
  reason: string;
  status: QualityHoldStatus;
  holdById: string;
  holdAt: Date;
  releasedById: string | null;
  releasedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionQualityHold extends Entity<ProductionQualityHoldProps> {
  get qualityHoldId(): UniqueEntityID {
    return this.props.id;
  }

  get productionOrderId(): UniqueEntityID {
    return this.props.productionOrderId;
  }

  get reason(): string {
    return this.props.reason;
  }

  get status(): QualityHoldStatus {
    return this.props.status;
  }

  get holdById(): string {
    return this.props.holdById;
  }

  get holdAt(): Date {
    return this.props.holdAt;
  }

  get releasedById(): string | null {
    return this.props.releasedById;
  }

  get releasedAt(): Date | null {
    return this.props.releasedAt;
  }

  get resolution(): string | null {
    return this.props.resolution;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  release(releasedById: string, resolution: string): void {
    this.props.status = 'RELEASED';
    this.props.releasedById = releasedById;
    this.props.releasedAt = new Date();
    this.props.resolution = resolution;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionQualityHoldProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'holdAt'
      | 'releasedById'
      | 'releasedAt'
      | 'resolution'
    >,
    id?: UniqueEntityID,
  ): ProductionQualityHold {
    const holdId = id ?? props.id ?? new UniqueEntityID();

    const hold = new ProductionQualityHold(
      {
        ...props,
        id: holdId,
        status: props.status ?? 'ACTIVE',
        holdAt: props.holdAt ?? new Date(),
        releasedById: props.releasedById ?? null,
        releasedAt: props.releasedAt ?? null,
        resolution: props.resolution ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      holdId,
    );

    return hold;
  }
}
