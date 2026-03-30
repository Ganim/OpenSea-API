import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ShiftAssignmentProps {
  tenantId: UniqueEntityID;
  shiftId: UniqueEntityID;
  employeeId: UniqueEntityID;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ShiftAssignment extends Entity<ShiftAssignmentProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get shiftId(): UniqueEntityID {
    return this.props.shiftId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if this assignment is currently effective (active and within date range).
   */
  isCurrentlyEffective(): boolean {
    if (!this.isActive) return false;

    const now = new Date();
    if (now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;

    return true;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.endDate = new Date();
    this.props.updatedAt = new Date();
  }

  private constructor(props: ShiftAssignmentProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<ShiftAssignmentProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): ShiftAssignment {
    const now = new Date();
    return new ShiftAssignment(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
