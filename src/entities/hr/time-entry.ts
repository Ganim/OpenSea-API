import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { TimeEntryType } from './value-objects';

export interface TimeEntryProps {
  employeeId: UniqueEntityID;
  entryType: TimeEntryType;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
  createdAt: Date;
}

export class TimeEntry extends Entity<TimeEntryProps> {
  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get entryType(): TimeEntryType {
    return this.props.entryType;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  get latitude(): number | undefined {
    return this.props.latitude;
  }

  get longitude(): number | undefined {
    return this.props.longitude;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business methods
  hasLocation(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }

  isClockIn(): boolean {
    return this.entryType.isClockIn();
  }

  isClockOut(): boolean {
    return this.entryType.isClockOut();
  }

  isBreakStart(): boolean {
    return this.entryType.isBreakStart();
  }

  isBreakEnd(): boolean {
    return this.entryType.isBreakEnd();
  }

  isOnSameDay(other: TimeEntry): boolean {
    return (
      this.timestamp.toDateString() === other.timestamp.toDateString() &&
      this.employeeId.equals(other.employeeId)
    );
  }

  private constructor(props: TimeEntryProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<TimeEntryProps, 'createdAt'>,
    id?: UniqueEntityID,
  ): TimeEntry {
    return new TimeEntry(
      {
        ...props,
        createdAt: new Date(),
      },
      id,
    );
  }
}
