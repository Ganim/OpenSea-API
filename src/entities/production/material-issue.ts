import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionMaterialIssueProps {
  id: UniqueEntityID;
  productionOrderId: UniqueEntityID;
  materialId: UniqueEntityID;
  warehouseId: UniqueEntityID;
  quantity: number;
  batchNumber: string | null;
  issuedById: UniqueEntityID;
  issuedAt: Date;
  notes: string | null;
}

export class ProductionMaterialIssue extends Entity<ProductionMaterialIssueProps> {
  get materialIssueId(): UniqueEntityID {
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

  get batchNumber(): string | null {
    return this.props.batchNumber;
  }

  get issuedById(): UniqueEntityID {
    return this.props.issuedById;
  }

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  static create(
    props: Optional<
      ProductionMaterialIssueProps,
      'id' | 'issuedAt' | 'batchNumber' | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionMaterialIssue {
    const issueId = id ?? props.id ?? new UniqueEntityID();

    const issue = new ProductionMaterialIssue(
      {
        ...props,
        id: issueId,
        batchNumber: props.batchNumber ?? null,
        notes: props.notes ?? null,
        issuedAt: props.issuedAt ?? new Date(),
      },
      issueId,
    );

    return issue;
  }
}
