import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface ProductionDefectRecordProps {
  id: UniqueEntityID;
  inspectionResultId: UniqueEntityID | null;
  defectTypeId: UniqueEntityID;
  operatorId: UniqueEntityID | null;
  quantity: number;
  severity: DefectSeverity;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export class ProductionDefectRecord extends Entity<ProductionDefectRecordProps> {
  get defectRecordId(): UniqueEntityID {
    return this.props.id;
  }

  get inspectionResultId(): UniqueEntityID | null {
    return this.props.inspectionResultId;
  }

  get defectTypeId(): UniqueEntityID {
    return this.props.defectTypeId;
  }

  get operatorId(): UniqueEntityID | null {
    return this.props.operatorId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get severity(): DefectSeverity {
    return this.props.severity;
  }

  get description(): string | null {
    return this.props.description;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Setters
  set quantity(quantity: number) {
    this.props.quantity = quantity;
  }

  set description(description: string | null) {
    this.props.description = description;
  }

  set imageUrl(imageUrl: string | null) {
    this.props.imageUrl = imageUrl;
  }

  static create(
    props: Optional<
      ProductionDefectRecordProps,
      | 'id'
      | 'createdAt'
      | 'inspectionResultId'
      | 'operatorId'
      | 'quantity'
      | 'description'
      | 'imageUrl'
    >,
    id?: UniqueEntityID,
  ): ProductionDefectRecord {
    const recordId = id ?? props.id ?? new UniqueEntityID();

    const record = new ProductionDefectRecord(
      {
        ...props,
        id: recordId,
        inspectionResultId: props.inspectionResultId ?? null,
        operatorId: props.operatorId ?? null,
        quantity: props.quantity ?? 1,
        description: props.description ?? null,
        imageUrl: props.imageUrl ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      recordId,
    );

    return record;
  }
}
