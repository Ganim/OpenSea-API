import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionMaterialReturnProps {
  id: UniqueEntityID;
  productionOrderId: UniqueEntityID;
  materialId: UniqueEntityID;
  warehouseId: UniqueEntityID;
  quantity: number;
  reason: string | null;
  returnedById: UniqueEntityID;
  returnedAt: Date;
}

export class ProductionMaterialReturn extends Entity<ProductionMaterialReturnProps> {
  get materialReturnId(): UniqueEntityID {
    return this.props.id;
  }

  get productionOrderId(): UniqueEntityID {
    return this.props.productionOrderId;
  }

  get materialId(): UniqueEntityID {
    return this.props.materialId;
  }

  get warehouseId(): UniqueEntityID {
    return this.props.warehouseId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get returnedById(): UniqueEntityID {
    return this.props.returnedById;
  }

  get returnedAt(): Date {
    return this.props.returnedAt;
  }

  static create(
    props: Optional<
      ProductionMaterialReturnProps,
      'id' | 'returnedAt' | 'reason'
    >,
    id?: UniqueEntityID,
  ): ProductionMaterialReturn {
    const returnId = id ?? props.id ?? new UniqueEntityID();

    const materialReturn = new ProductionMaterialReturn(
      {
        ...props,
        id: returnId,
        reason: props.reason ?? null,
        returnedAt: props.returnedAt ?? new Date(),
      },
      returnId,
    );

    return materialReturn;
  }
}
