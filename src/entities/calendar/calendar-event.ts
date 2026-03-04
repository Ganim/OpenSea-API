import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CalendarEventProps {
  tenantId: UniqueEntityID;
  calendarId?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  type: string;
  visibility: string;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
  systemSourceType?: string | null;
  systemSourceId?: string | null;
  metadata: Record<string, unknown>;
  createdBy: UniqueEntityID;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class CalendarEvent extends Entity<CalendarEventProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get calendarId(): string | null {
    return this.props.calendarId ?? null;
  }

  set calendarId(calendarId: string | null) {
    this.props.calendarId = calendarId;
    this.touch();
  }

  get title(): string {
    return this.props.title;
  }

  set title(title: string) {
    this.props.title = title;
    this.touch();
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  get location(): string | null {
    return this.props.location ?? null;
  }

  set location(location: string | null) {
    this.props.location = location;
    this.touch();
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  set startDate(startDate: Date) {
    this.props.startDate = startDate;
    this.touch();
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  set endDate(endDate: Date) {
    this.props.endDate = endDate;
    this.touch();
  }

  get isAllDay(): boolean {
    return this.props.isAllDay;
  }

  set isAllDay(isAllDay: boolean) {
    this.props.isAllDay = isAllDay;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }

  set type(type: string) {
    this.props.type = type;
    this.touch();
  }

  get visibility(): string {
    return this.props.visibility;
  }

  set visibility(visibility: string) {
    this.props.visibility = visibility;
    this.touch();
  }

  get color(): string | null {
    return this.props.color ?? null;
  }

  set color(color: string | null) {
    this.props.color = color;
    this.touch();
  }

  get rrule(): string | null {
    return this.props.rrule ?? null;
  }

  set rrule(rrule: string | null) {
    this.props.rrule = rrule;
    this.touch();
  }

  get timezone(): string | null {
    return this.props.timezone ?? null;
  }

  set timezone(timezone: string | null) {
    this.props.timezone = timezone;
    this.touch();
  }

  get systemSourceType(): string | null {
    return this.props.systemSourceType ?? null;
  }

  get systemSourceId(): string | null {
    return this.props.systemSourceId ?? null;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  set metadata(metadata: Record<string, unknown>) {
    this.props.metadata = metadata;
    this.touch();
  }

  get createdBy(): UniqueEntityID {
    return this.props.createdBy;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt ?? null;
  }

  get isSystemEvent(): boolean {
    return !!this.props.systemSourceType && !!this.props.systemSourceId;
  }

  get isRecurring(): boolean {
    return !!this.props.rrule;
  }

  get isPrivate(): boolean {
    return this.props.visibility === 'PRIVATE';
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<
      CalendarEventProps,
      'createdAt' | 'isAllDay' | 'type' | 'visibility' | 'metadata'
    > & {
      createdAt?: Date;
      isAllDay?: boolean;
      type?: string;
      visibility?: string;
      metadata?: Record<string, unknown>;
    },
    id?: UniqueEntityID,
  ): CalendarEvent {
    return new CalendarEvent(
      {
        ...props,
        isAllDay: props.isAllDay ?? false,
        type: props.type ?? 'CUSTOM',
        visibility: props.visibility ?? 'PUBLIC',
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
