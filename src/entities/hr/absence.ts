import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { AbsenceStatus, AbsenceType } from './value-objects';

export interface AbsenceProps {
  employeeId: UniqueEntityID;
  type: AbsenceType;
  status: AbsenceStatus;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  documentUrl?: string;
  cid?: string; // CID (atestado médico)
  isPaid: boolean;
  isInssResponsibility?: boolean; // For sick leave > 15 days (Brazilian law)
  vacationPeriodId?: UniqueEntityID;
  requestedBy?: UniqueEntityID;
  approvedBy?: UniqueEntityID;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Absence extends Entity<AbsenceProps> {
  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get type(): AbsenceType {
    return this.props.type;
  }

  get status(): AbsenceStatus {
    return this.props.status;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get totalDays(): number {
    return this.props.totalDays;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get documentUrl(): string | undefined {
    return this.props.documentUrl;
  }

  get cid(): string | undefined {
    return this.props.cid;
  }

  get isPaid(): boolean {
    return this.props.isPaid;
  }

  get isInssResponsibility(): boolean {
    return this.props.isInssResponsibility ?? false;
  }

  get vacationPeriodId(): UniqueEntityID | undefined {
    return this.props.vacationPeriodId;
  }

  get requestedBy(): UniqueEntityID | undefined {
    return this.props.requestedBy;
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
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

  // Business methods
  isPending(): boolean {
    return this.status.isPending();
  }

  isApproved(): boolean {
    return this.status.isApproved();
  }

  isRejected(): boolean {
    return this.status.isRejected();
  }

  isCancelled(): boolean {
    return this.status.isCancelled();
  }

  isInProgress(): boolean {
    return this.status.isInProgress();
  }

  isCompleted(): boolean {
    return this.status.isCompleted();
  }

  isVacation(): boolean {
    return this.type.isVacation();
  }

  isSickLeave(): boolean {
    return this.type.isSickLeave();
  }

  hasDocument(): boolean {
    return !!this.documentUrl;
  }

  hasCid(): boolean {
    return !!this.cid;
  }

  approve(approvedBy: UniqueEntityID): void {
    if (!this.status.canBeApproved()) {
      throw new Error('Absence cannot be approved in current status');
    }

    this.props.status = AbsenceStatus.approved();
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(rejectedBy: UniqueEntityID, reason: string): void {
    if (!this.status.canBeRejected()) {
      throw new Error('Absence cannot be rejected in current status');
    }

    this.props.status = AbsenceStatus.rejected();
    this.props.approvedBy = rejectedBy;
    this.props.approvedAt = new Date();
    this.props.rejectionReason = reason;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new Error('Absence cannot be cancelled in current status');
    }

    this.props.status = AbsenceStatus.cancelled();
    this.props.updatedAt = new Date();
  }

  startProgress(): void {
    if (!this.status.canStartProgress()) {
      throw new Error('Absence cannot start progress in current status');
    }

    this.props.status = AbsenceStatus.inProgress();
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (!this.status.canBeCompleted()) {
      throw new Error('Absence cannot be completed in current status');
    }

    this.props.status = AbsenceStatus.completed();
    this.props.updatedAt = new Date();
  }

  updateDocument(documentUrl: string): void {
    this.props.documentUrl = documentUrl;
    this.props.updatedAt = new Date();
  }

  updateCid(cid: string): void {
    this.props.cid = cid;
    this.props.updatedAt = new Date();
  }

  updateNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  /**
   * Checks if the absence overlaps with a date range
   */
  overlapsWithDateRange(start: Date, end: Date): boolean {
    return this.startDate <= end && this.endDate >= start;
  }

  /**
   * Checks if the absence is currently active (today is within the range)
   */
  isCurrentlyActive(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.startDate <= today && this.endDate >= today;
  }

  private constructor(props: AbsenceProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<AbsenceProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Absence {
    const now = new Date();
    return new Absence(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  /**
   * Calculate total days between two dates (inclusive)
   */
  static calculateTotalDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to include both start and end dates
  }
}
