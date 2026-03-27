import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FlexBenefitAllocationProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  month: number;
  year: number;
  totalBudget: number;
  allocations: Record<string, number>;
  status: string;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class FlexBenefitAllocation extends Entity<FlexBenefitAllocationProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get month(): number {
    return this.props.month;
  }

  get year(): number {
    return this.props.year;
  }

  get totalBudget(): number {
    return this.props.totalBudget;
  }

  get allocations(): Record<string, number> {
    return this.props.allocations;
  }

  get status(): string {
    return this.props.status;
  }

  get confirmedAt(): Date | undefined {
    return this.props.confirmedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get allocatedTotal(): number {
    return Object.values(this.props.allocations).reduce(
      (sum, amount) => sum + amount,
      0,
    );
  }

  get remainingBudget(): number {
    return this.props.totalBudget - this.allocatedTotal;
  }

  isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  isConfirmed(): boolean {
    return this.props.status === 'CONFIRMED';
  }

  isLocked(): boolean {
    return this.props.status === 'LOCKED';
  }

  confirm(): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error('Only DRAFT allocations can be confirmed');
    }
    this.props.status = 'CONFIRMED';
    this.props.confirmedAt = new Date();
    this.props.updatedAt = new Date();
  }

  lock(): void {
    this.props.status = 'LOCKED';
    this.props.updatedAt = new Date();
  }

  updateAllocations(allocations: Record<string, number>): void {
    if (this.props.status === 'LOCKED') {
      throw new Error('Cannot update a LOCKED allocation');
    }
    this.props.allocations = allocations;
    this.props.updatedAt = new Date();
  }

  private constructor(props: FlexBenefitAllocationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<FlexBenefitAllocationProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): FlexBenefitAllocation {
    const now = new Date();

    const status = props.status ?? 'DRAFT';

    return new FlexBenefitAllocation(
      {
        ...props,
        status,
        allocations: props.allocations ?? {},
        confirmedAt:
          props.confirmedAt ?? (status === 'CONFIRMED' ? now : undefined),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
