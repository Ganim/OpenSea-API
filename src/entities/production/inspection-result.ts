import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InspectionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL';

export interface ProductionInspectionResultProps {
  id: UniqueEntityID;
  inspectionPlanId: UniqueEntityID;
  productionOrderId: UniqueEntityID;
  inspectedById: UniqueEntityID;
  inspectedAt: Date;
  sampleSize: number;
  defectsFound: number;
  status: InspectionStatus;
  notes: string | null;
  createdAt: Date;
}

export class ProductionInspectionResult extends Entity<ProductionInspectionResultProps> {
  get inspectionResultId(): UniqueEntityID {
    return this.props.id;
  }

  get inspectionPlanId(): UniqueEntityID {
    return this.props.inspectionPlanId;
  }

  get productionOrderId(): UniqueEntityID {
    return this.props.productionOrderId;
  }

  get inspectedById(): UniqueEntityID {
    return this.props.inspectedById;
  }

  get inspectedAt(): Date {
    return this.props.inspectedAt;
  }

  get sampleSize(): number {
    return this.props.sampleSize;
  }

  get defectsFound(): number {
    return this.props.defectsFound;
  }

  get status(): InspectionStatus {
    return this.props.status;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Setters
  set defectsFound(defectsFound: number) {
    this.props.defectsFound = defectsFound;
  }

  set notes(notes: string | null) {
    this.props.notes = notes;
  }

  // Business methods
  pass(): void {
    this.props.status = 'PASSED';
  }

  fail(): void {
    this.props.status = 'FAILED';
  }

  conditional(): void {
    this.props.status = 'CONDITIONAL';
  }

  static create(
    props: Optional<
      ProductionInspectionResultProps,
      'id' | 'createdAt' | 'inspectedAt' | 'defectsFound' | 'status' | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionInspectionResult {
    const resultId = id ?? props.id ?? new UniqueEntityID();

    const result = new ProductionInspectionResult(
      {
        ...props,
        id: resultId,
        inspectedAt: props.inspectedAt ?? new Date(),
        defectsFound: props.defectsFound ?? 0,
        status: props.status ?? 'PENDING',
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      resultId,
    );

    return result;
  }
}
