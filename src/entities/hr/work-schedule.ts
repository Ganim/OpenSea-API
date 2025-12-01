import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface WorkScheduleProps {
  name: string;
  description?: string;
  mondayStart?: string;
  mondayEnd?: string;
  tuesdayStart?: string;
  tuesdayEnd?: string;
  wednesdayStart?: string;
  wednesdayEnd?: string;
  thursdayStart?: string;
  thursdayEnd?: string;
  fridayStart?: string;
  fridayEnd?: string;
  saturdayStart?: string;
  saturdayEnd?: string;
  sundayStart?: string;
  sundayEnd?: string;
  breakDuration: number; // Minutos
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkSchedule extends Entity<WorkScheduleProps> {
  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get mondayStart(): string | undefined {
    return this.props.mondayStart;
  }

  get mondayEnd(): string | undefined {
    return this.props.mondayEnd;
  }

  get tuesdayStart(): string | undefined {
    return this.props.tuesdayStart;
  }

  get tuesdayEnd(): string | undefined {
    return this.props.tuesdayEnd;
  }

  get wednesdayStart(): string | undefined {
    return this.props.wednesdayStart;
  }

  get wednesdayEnd(): string | undefined {
    return this.props.wednesdayEnd;
  }

  get thursdayStart(): string | undefined {
    return this.props.thursdayStart;
  }

  get thursdayEnd(): string | undefined {
    return this.props.thursdayEnd;
  }

  get fridayStart(): string | undefined {
    return this.props.fridayStart;
  }

  get fridayEnd(): string | undefined {
    return this.props.fridayEnd;
  }

  get saturdayStart(): string | undefined {
    return this.props.saturdayStart;
  }

  get saturdayEnd(): string | undefined {
    return this.props.saturdayEnd;
  }

  get sundayStart(): string | undefined {
    return this.props.sundayStart;
  }

  get sundayEnd(): string | undefined {
    return this.props.sundayEnd;
  }

  get breakDuration(): number {
    return this.props.breakDuration;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  getDaySchedule(day: number): {
    start: string | undefined;
    end: string | undefined;
  } {
    switch (day) {
      case 0:
        return { start: this.sundayStart, end: this.sundayEnd };
      case 1:
        return { start: this.mondayStart, end: this.mondayEnd };
      case 2:
        return { start: this.tuesdayStart, end: this.tuesdayEnd };
      case 3:
        return { start: this.wednesdayStart, end: this.wednesdayEnd };
      case 4:
        return { start: this.thursdayStart, end: this.thursdayEnd };
      case 5:
        return { start: this.fridayStart, end: this.fridayEnd };
      case 6:
        return { start: this.saturdayStart, end: this.saturdayEnd };
      default:
        return { start: undefined, end: undefined };
    }
  }

  isWorkingDay(day: number): boolean {
    const schedule = this.getDaySchedule(day);
    return schedule.start !== undefined && schedule.end !== undefined;
  }

  calculateDailyHours(day: number): number {
    const schedule = this.getDaySchedule(day);
    if (!schedule.start || !schedule.end) return 0;

    const [startHour, startMin] = schedule.start.split(':').map(Number);
    const [endHour, endMin] = schedule.end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const workedMinutes = endMinutes - startMinutes - this.breakDuration;
    return workedMinutes / 60;
  }

  calculateWeeklyHours(): number {
    let total = 0;
    for (let day = 0; day <= 6; day++) {
      total += this.calculateDailyHours(day);
    }
    return total;
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  private constructor(props: WorkScheduleProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<WorkScheduleProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): WorkSchedule {
    const now = new Date();
    return new WorkSchedule(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
