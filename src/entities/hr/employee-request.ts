import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type EmployeeRequestType =
  | 'VACATION'
  | 'ABSENCE'
  | 'ADVANCE'
  | 'DATA_CHANGE'
  | 'SUPPORT';

export type EmployeeRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface EmployeeRequestProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  type: EmployeeRequestType;
  status: EmployeeRequestStatus;
  data: Record<string, unknown>;
  approverEmployeeId?: UniqueEntityID;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeRequest extends Entity<EmployeeRequestProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get type(): EmployeeRequestType {
    return this.props.type;
  }

  get status(): EmployeeRequestStatus {
    return this.props.status;
  }

  get data(): Record<string, unknown> {
    return this.props.data;
  }

  get approverEmployeeId(): UniqueEntityID | undefined {
    return this.props.approverEmployeeId;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.status === 'PENDING';
  }

  isApproved(): boolean {
    return this.status === 'APPROVED';
  }

  isRejected(): boolean {
    return this.status === 'REJECTED';
  }

  isCancelled(): boolean {
    return this.status === 'CANCELLED';
  }

  approve(approverId: UniqueEntityID): void {
    if (!this.isPending()) {
      throw new Error('Only pending requests can be approved');
    }

    this.props.status = 'APPROVED';
    this.props.approverEmployeeId = approverId;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(approverId: UniqueEntityID, reason: string): void {
    if (!this.isPending()) {
      throw new Error('Only pending requests can be rejected');
    }

    this.props.status = 'REJECTED';
    this.props.approverEmployeeId = approverId;
    this.props.approvedAt = new Date();
    this.props.rejectionReason = reason;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (!this.isPending()) {
      throw new Error('Only pending requests can be cancelled');
    }

    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  private constructor(props: EmployeeRequestProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EmployeeRequestProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): EmployeeRequest {
    const now = new Date();
    return new EmployeeRequest(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
