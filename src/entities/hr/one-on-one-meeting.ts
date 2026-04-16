import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type OneOnOneStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface OneOnOneMeetingProps {
  tenantId: UniqueEntityID;
  managerId: UniqueEntityID;
  reportId: UniqueEntityID;
  scheduledAt: Date;
  durationMinutes: number;
  status: OneOnOneStatus;
  privateNotesManager?: string;
  privateNotesReport?: string;
  sharedNotes?: string;
  cancelledReason?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class OneOnOneMeeting extends Entity<OneOnOneMeetingProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get managerId(): UniqueEntityID {
    return this.props.managerId;
  }

  get reportId(): UniqueEntityID {
    return this.props.reportId;
  }

  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }

  set scheduledAt(value: Date) {
    this.props.scheduledAt = value;
    this.touch();
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  set durationMinutes(value: number) {
    this.props.durationMinutes = value;
    this.touch();
  }

  get status(): OneOnOneStatus {
    return this.props.status;
  }

  get privateNotesManager(): string | undefined {
    return this.props.privateNotesManager;
  }

  get privateNotesReport(): string | undefined {
    return this.props.privateNotesReport;
  }

  get sharedNotes(): string | undefined {
    return this.props.sharedNotes;
  }

  get cancelledReason(): string | undefined {
    return this.props.cancelledReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  setManagerNotes(notes: string | undefined): void {
    this.props.privateNotesManager = notes;
    this.touch();
  }

  setReportNotes(notes: string | undefined): void {
    this.props.privateNotesReport = notes;
    this.touch();
  }

  setSharedNotes(notes: string | undefined): void {
    this.props.sharedNotes = notes;
    this.touch();
  }

  markCompleted(): void {
    this.props.status = 'COMPLETED';
    this.touch();
  }

  cancel(reason?: string): void {
    this.props.status = 'CANCELLED';
    this.props.cancelledReason = reason;
    this.touch();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  isManager(employeeId: UniqueEntityID): boolean {
    return this.managerId.equals(employeeId);
  }

  isReport(employeeId: UniqueEntityID): boolean {
    return this.reportId.equals(employeeId);
  }

  isParticipant(employeeId: UniqueEntityID): boolean {
    return this.isManager(employeeId) || this.isReport(employeeId);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private constructor(props: OneOnOneMeetingProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<OneOnOneMeetingProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): OneOnOneMeeting {
    const now = new Date();
    return new OneOnOneMeeting(
      {
        ...props,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
