import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { WarningSeverity, WarningStatus, WarningType } from './value-objects';

export interface EmployeeWarningProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  issuedBy: UniqueEntityID;
  type: WarningType;
  severity: WarningSeverity;
  status: WarningStatus;
  reason: string;
  description?: string;
  incidentDate: Date;
  witnessName?: string;
  employeeAcknowledged: boolean;
  acknowledgedAt?: Date;
  suspensionDays?: number;
  attachmentUrl?: string;
  revokedAt?: Date;
  revokeReason?: string;
  /**
   * Soft-delete marker. Present only when the warning has been deleted but
   * still persists in the DB for CLT Art. 474 compliance (labor-court
   * auditability of disciplinary history).
   */
  deletedAt?: Date;
  /**
   * User id (not employee id) that triggered the soft-delete. Optional
   * because legacy warnings soft-deleted before this audit field was added
   * may not carry it.
   */
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeWarning extends Entity<EmployeeWarningProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get issuedBy(): UniqueEntityID {
    return this.props.issuedBy;
  }

  get type(): WarningType {
    return this.props.type;
  }

  get severity(): WarningSeverity {
    return this.props.severity;
  }

  get status(): WarningStatus {
    return this.props.status;
  }

  get reason(): string {
    return this.props.reason;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get incidentDate(): Date {
    return this.props.incidentDate;
  }

  get witnessName(): string | undefined {
    return this.props.witnessName;
  }

  get employeeAcknowledged(): boolean {
    return this.props.employeeAcknowledged;
  }

  get acknowledgedAt(): Date | undefined {
    return this.props.acknowledgedAt;
  }

  get suspensionDays(): number | undefined {
    return this.props.suspensionDays;
  }

  get attachmentUrl(): string | undefined {
    return this.props.attachmentUrl;
  }

  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }

  get revokeReason(): string | undefined {
    return this.props.revokeReason;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get deletedBy(): string | undefined {
    return this.props.deletedBy;
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  /**
   * Soft-delete the warning. Leaves the row in place for CLT Art. 474
   * compliance and stamps who triggered it.
   */
  softDelete(deletedBy: string): void {
    if (this.props.deletedAt) {
      throw new Error('Warning has already been deleted');
    }
    this.props.deletedAt = new Date();
    this.props.deletedBy = deletedBy;
    this.props.updatedAt = this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isActive(): boolean {
    return this.status.isActive();
  }

  isRevoked(): boolean {
    return this.status.isRevoked();
  }

  isSuspension(): boolean {
    return this.type.isSuspension();
  }

  hasBeenAcknowledged(): boolean {
    return this.employeeAcknowledged;
  }

  revoke(revokeReason: string): void {
    if (!this.status.canBeRevoked()) {
      throw new Error('Warning cannot be revoked in current status');
    }

    this.props.status = WarningStatus.revoked();
    this.props.revokedAt = new Date();
    this.props.revokeReason = revokeReason;
    this.props.updatedAt = new Date();
  }

  acknowledge(): void {
    if (this.employeeAcknowledged) {
      throw new Error('Warning has already been acknowledged');
    }

    this.props.employeeAcknowledged = true;
    this.props.acknowledgedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private constructor(props: EmployeeWarningProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EmployeeWarningProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): EmployeeWarning {
    const now = new Date();
    return new EmployeeWarning(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
