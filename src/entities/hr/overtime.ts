import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface OvertimeProps {
  employeeId: UniqueEntityID;
  date: Date;
  hours: number;
  reason: string;
  approved: boolean;
  approvedBy?: UniqueEntityID;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Overtime extends Entity<OvertimeProps> {
  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get date(): Date {
    return this.props.date;
  }

  get hours(): number {
    return this.props.hours;
  }

  get reason(): string {
    return this.props.reason;
  }

  get approved(): boolean {
    return this.props.approved;
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isPending(): boolean {
    return !this.approved;
  }

  isApproved(): boolean {
    return this.approved;
  }

  approve(approvedBy: UniqueEntityID): void {
    if (this.approved) {
      throw new Error('Overtime is already approved');
    }

    this.props.approved = true;
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(): void {
    if (this.approved) {
      throw new Error('Cannot reject already approved overtime');
    }
    this.props.updatedAt = new Date();
  }

  private constructor(props: OvertimeProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<OvertimeProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Overtime {
    const now = new Date();
    return new Overtime(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
