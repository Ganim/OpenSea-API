import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FinanceBudgetProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  categoryId: UniqueEntityID;
  costCenterId?: UniqueEntityID;
  year: number;
  month: number;
  budgetAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class FinanceBudget extends Entity<FinanceBudgetProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get categoryId(): UniqueEntityID {
    return this.props.categoryId;
  }
  set categoryId(value: UniqueEntityID) {
    this.props.categoryId = value;
    this.touch();
  }

  get costCenterId(): UniqueEntityID | undefined {
    return this.props.costCenterId;
  }
  set costCenterId(value: UniqueEntityID | undefined) {
    this.props.costCenterId = value;
    this.touch();
  }

  get year(): number {
    return this.props.year;
  }

  get month(): number {
    return this.props.month;
  }

  get budgetAmount(): number {
    return this.props.budgetAmount;
  }
  set budgetAmount(value: number) {
    this.props.budgetAmount = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }
  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<FinanceBudgetProps, 'id' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): FinanceBudget {
    return new FinanceBudget(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
