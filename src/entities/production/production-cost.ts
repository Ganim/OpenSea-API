import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ProductionCostType = 'MATERIAL' | 'LABOR' | 'OVERHEAD';

export interface ProductionCostProps {
  id: UniqueEntityID;
  productionOrderId: UniqueEntityID;
  costType: ProductionCostType;
  description: string | null;
  plannedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionCost extends Entity<ProductionCostProps> {
  get productionCostId(): UniqueEntityID {
    return this.props.id;
  }

  get productionOrderId(): UniqueEntityID {
    return this.props.productionOrderId;
  }

  get costType(): ProductionCostType {
    return this.props.costType;
  }

  get description(): string | null {
    return this.props.description;
  }

  get plannedAmount(): number {
    return this.props.plannedAmount;
  }

  get actualAmount(): number {
    return this.props.actualAmount;
  }

  get varianceAmount(): number {
    return this.props.varianceAmount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Computed: actualAmount - plannedAmount */
  get variance(): number {
    return this.actualAmount - this.plannedAmount;
  }

  set costType(costType: ProductionCostType) {
    this.props.costType = costType;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set plannedAmount(plannedAmount: number) {
    this.props.plannedAmount = plannedAmount;
    this.touch();
  }

  set actualAmount(actualAmount: number) {
    this.props.actualAmount = actualAmount;
    this.touch();
  }

  set varianceAmount(varianceAmount: number) {
    this.props.varianceAmount = varianceAmount;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionCostProps,
      'id' | 'createdAt' | 'updatedAt' | 'description' | 'varianceAmount'
    >,
    id?: UniqueEntityID,
  ): ProductionCost {
    const costId = id ?? props.id ?? new UniqueEntityID();

    const cost = new ProductionCost(
      {
        ...props,
        id: costId,
        description: props.description ?? null,
        varianceAmount:
          props.varianceAmount ?? props.actualAmount - props.plannedAmount,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      costId,
    );

    return cost;
  }
}
