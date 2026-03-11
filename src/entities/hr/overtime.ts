import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface OvertimeProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  date: Date;
  hours: number;
  reason: string;
  approved: boolean;
  approvedBy?: UniqueEntityID;
  approvedAt?: Date;
  rejected: boolean;
  rejectedBy?: UniqueEntityID;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Overtime extends Entity<OvertimeProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

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

  get rejected(): boolean {
    return this.props.rejected;
  }

  get rejectedBy(): UniqueEntityID | undefined {
    return this.props.rejectedBy;
  }

  get rejectedAt(): Date | undefined {
    return this.props.rejectedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isPending(): boolean {
    return !this.approved && !this.rejected;
  }

  isApproved(): boolean {
    return this.approved;
  }

  isRejected(): boolean {
    return this.rejected;
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

  reject(rejectedBy: UniqueEntityID): void {
    if (this.approved) {
      throw new Error('Cannot reject already approved overtime');
    }
    if (this.rejected) {
      throw new Error('Overtime is already rejected');
    }
    this.props.rejected = true;
    this.props.rejectedBy = rejectedBy;
    this.props.rejectedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private constructor(props: OvertimeProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<OvertimeProps, 'createdAt' | 'updatedAt' | 'rejected'> & {
      rejected?: boolean;
    },
    id?: UniqueEntityID,
  ): Overtime {
    const now = new Date();
    return new Overtime(
      {
        ...props,
        rejected: props.rejected ?? false,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
