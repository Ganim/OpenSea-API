import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionInspectionPlanProps {
  id: UniqueEntityID;
  operationRoutingId: UniqueEntityID;
  inspectionType: string;
  description: string | null;
  sampleSize: number;
  aqlLevel: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionInspectionPlan extends Entity<ProductionInspectionPlanProps> {
  get inspectionPlanId(): UniqueEntityID {
    return this.props.id;
  }

  get operationRoutingId(): UniqueEntityID {
    return this.props.operationRoutingId;
  }

  get inspectionType(): string {
    return this.props.inspectionType;
  }

  get description(): string | null {
    return this.props.description;
  }

  get sampleSize(): number {
    return this.props.sampleSize;
  }

  get aqlLevel(): string | null {
    return this.props.aqlLevel;
  }

  get instructions(): string | null {
    return this.props.instructions;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set inspectionType(inspectionType: string) {
    this.props.inspectionType = inspectionType;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set sampleSize(sampleSize: number) {
    this.props.sampleSize = sampleSize;
    this.touch();
  }

  set aqlLevel(aqlLevel: string | null) {
    this.props.aqlLevel = aqlLevel;
    this.touch();
  }

  set instructions(instructions: string | null) {
    this.props.instructions = instructions;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionInspectionPlanProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'description'
      | 'aqlLevel'
      | 'instructions'
      | 'isActive'
    >,
    id?: UniqueEntityID,
  ): ProductionInspectionPlan {
    const planId = id ?? props.id ?? new UniqueEntityID();

    const plan = new ProductionInspectionPlan(
      {
        ...props,
        id: planId,
        description: props.description ?? null,
        aqlLevel: props.aqlLevel ?? null,
        instructions: props.instructions ?? null,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      planId,
    );

    return plan;
  }
}
