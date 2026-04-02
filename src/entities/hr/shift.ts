import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ShiftType = 'FIXED' | 'ROTATING' | 'FLEXIBLE' | 'ON_CALL';

export interface ShiftProps {
  tenantId: UniqueEntityID;
  name: string;
  code?: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNightShift: boolean;
  color?: string;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Shift extends Entity<ShiftProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string | undefined {
    return this.props.code;
  }

  get type(): ShiftType {
    return this.props.type;
  }

  get startTime(): string {
    return this.props.startTime;
  }

  get endTime(): string {
    return this.props.endTime;
  }

  get breakMinutes(): number {
    return this.props.breakMinutes;
  }

  get isNightShift(): boolean {
    return this.props.isNightShift;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Calculate the total shift duration in minutes (excluding break).
   * Handles overnight shifts (e.g. 22:00 - 06:00).
   */
  calculateDurationMinutes(): number {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    return endMinutes - startMinutes - this.breakMinutes;
  }

  /**
   * Calculate the total shift duration in hours (excluding break).
   */
  calculateDurationHours(): number {
    return this.calculateDurationMinutes() / 60;
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  private constructor(props: ShiftProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<ShiftProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Shift {
    const now = new Date();
    return new Shift(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
