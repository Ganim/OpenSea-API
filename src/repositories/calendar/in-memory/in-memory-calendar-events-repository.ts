import { CalendarEvent } from '@/entities/calendar/calendar-event';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CalendarEventsRepository,
  CalendarEventWithRelations,
  CreateCalendarEventSchema,
  UpdateCalendarEventSchema,
  FindManyCalendarEventsOptions,
  FindManyCalendarEventsResult,
  FindManyWithRelationsResult,
} from '../calendar-events-repository';

export class InMemoryCalendarEventsRepository
  implements CalendarEventsRepository
{
  public items: CalendarEvent[] = [];
  public participantsStore = new Map<
    string,
    CalendarEventWithRelations['participants']
  >();
  public remindersStore = new Map<
    string,
    CalendarEventWithRelations['reminders']
  >();

  async create(data: CreateCalendarEventSchema): Promise<CalendarEvent> {
    const event = CalendarEvent.create({
      tenantId: new UniqueEntityID(data.tenantId),
      calendarId: data.calendarId,
      title: data.title,
      description: data.description,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      isAllDay: data.isAllDay,
      type: data.type,
      visibility: data.visibility,
      color: data.color,
      rrule: data.rrule,
      timezone: data.timezone,
      systemSourceType: data.systemSourceType,
      systemSourceId: data.systemSourceId,
      metadata: data.metadata,
      createdBy: new UniqueEntityID(data.createdBy),
    });

    this.items.push(event);
    return event;
  }

  async findById(id: string, tenantId: string): Promise<CalendarEvent | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id &&
          item.tenantId.toString() === tenantId &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async findByIdWithRelations(
    id: string,
    tenantId: string,
  ): Promise<CalendarEventWithRelations | null> {
    const event = await this.findById(id, tenantId);
    if (!event) return null;
    return {
      event,
      creatorName: null,
      participants: this.participantsStore.get(event.id.toString()) ?? [],
      reminders: this.remindersStore.get(event.id.toString()) ?? [],
    };
  }

  async findMany(
    options: FindManyCalendarEventsOptions,
  ): Promise<FindManyCalendarEventsResult> {
    const filtered = this.items.filter((item) => {
      if (item.tenantId.toString() !== options.tenantId) return false;
      if (item.deletedAt) return false;
      if (item.startDate > options.endDate) return false;
      if (item.endDate < options.startDate) return false;
      if (options.type && item.type !== options.type) return false;
      if (!options.includeSystemEvents && item.isSystemEvent) return false;
      if (options.calendarIds && options.calendarIds.length > 0) {
        if (!item.calendarId || !options.calendarIds.includes(item.calendarId))
          return false;
      }
      if (options.search) {
        const search = options.search.toLowerCase();
        if (
          !item.title.toLowerCase().includes(search) &&
          !item.description?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      // Private events
      if (item.isPrivate) {
        if (item.createdBy.toString() !== options.userId) return false;
      }
      return true;
    });

    const total = filtered.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 500;
    const start = (page - 1) * limit;
    const events = filtered.slice(start, start + limit);

    return { events, total };
  }

  async findManyWithRelations(
    options: FindManyCalendarEventsOptions,
  ): Promise<FindManyWithRelationsResult> {
    const { events, total } = await this.findMany(options);
    return {
      events: events.map((event) => ({
        event,
        creatorName: null,
        participants: this.participantsStore.get(event.id.toString()) ?? [],
        reminders: this.remindersStore.get(event.id.toString()) ?? [],
      })),
      total,
    };
  }

  async findBySystemSource(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<CalendarEvent | null> {
    return (
      this.items.find(
        (item) =>
          item.tenantId.toString() === tenantId &&
          item.systemSourceType === sourceType &&
          item.systemSourceId === sourceId &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async update(data: UpdateCalendarEventSchema): Promise<CalendarEvent | null> {
    const event = this.items.find(
      (item) =>
        item.id.toString() === data.id &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!event) return null;

    if (data.title !== undefined) event.title = data.title;
    if (data.description !== undefined) event.description = data.description;
    if (data.location !== undefined) event.location = data.location;
    if (data.startDate !== undefined) event.startDate = data.startDate;
    if (data.endDate !== undefined) event.endDate = data.endDate;
    if (data.isAllDay !== undefined) event.isAllDay = data.isAllDay;
    if (data.type !== undefined) event.type = data.type;
    if (data.visibility !== undefined) event.visibility = data.visibility;
    if (data.color !== undefined) event.color = data.color;
    if (data.rrule !== undefined) event.rrule = data.rrule;
    if (data.timezone !== undefined) event.timezone = data.timezone;
    if (data.metadata !== undefined) event.metadata = data.metadata;

    return event;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const event = this.items.find(
      (item) =>
        item.id.toString() === id && item.tenantId.toString() === tenantId,
    );
    if (event) {
      event.delete();
    }
  }
}
