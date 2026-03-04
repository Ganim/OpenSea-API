import { Calendar } from '@/entities/calendar/calendar';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CalendarsRepository,
  CreateCalendarSchema,
  UpdateCalendarSchema,
} from '../calendars-repository';

export class InMemoryCalendarsRepository implements CalendarsRepository {
  public items: Calendar[] = [];

  async create(data: CreateCalendarSchema): Promise<Calendar> {
    const calendar = Calendar.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      color: data.color,
      type: data.type,
      ownerId: data.ownerId,
      systemModule: data.systemModule,
      isDefault: data.isDefault,
      settings: data.settings,
      createdBy: new UniqueEntityID(data.createdBy),
    });

    this.items.push(calendar);
    return calendar;
  }

  async findById(id: string, tenantId: string): Promise<Calendar | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id &&
          item.tenantId.toString() === tenantId &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async findPersonalByUser(
    userId: string,
    tenantId: string,
  ): Promise<Calendar | null> {
    return (
      this.items.find(
        (item) =>
          item.tenantId.toString() === tenantId &&
          item.type === 'PERSONAL' &&
          item.ownerId === userId &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async findOrCreatePersonal(
    tenantId: string,
    userId: string,
  ): Promise<Calendar> {
    const existing = await this.findPersonalByUser(userId, tenantId);
    if (existing) return existing;

    return this.create({
      tenantId,
      name: 'Meu Calendário',
      color: '#3b82f6',
      type: 'PERSONAL',
      ownerId: userId,
      isDefault: true,
      settings: {},
      createdBy: userId,
    });
  }

  async findByTeam(teamId: string, tenantId: string): Promise<Calendar[]> {
    return this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId &&
        item.type === 'TEAM' &&
        item.ownerId === teamId &&
        !item.deletedAt,
    );
  }

  async findSystemByModule(
    module: string,
    tenantId: string,
  ): Promise<Calendar | null> {
    return (
      this.items.find(
        (item) =>
          item.tenantId.toString() === tenantId &&
          item.type === 'SYSTEM' &&
          item.systemModule === module &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async listByUser(
    userId: string,
    tenantId: string,
    teamIds: string[],
  ): Promise<Calendar[]> {
    return this.items.filter((item) => {
      if (item.tenantId.toString() !== tenantId) return false;
      if (item.deletedAt) return false;

      if (item.isPersonal && item.ownerId === userId) return true;
      if (item.isTeam && item.ownerId && teamIds.includes(item.ownerId))
        return true;
      if (item.isSystem) return true;

      return false;
    });
  }

  async update(data: UpdateCalendarSchema): Promise<Calendar | null> {
    const calendar = this.items.find(
      (item) =>
        item.id.toString() === data.id &&
        item.tenantId.toString() === data.tenantId &&
        !item.deletedAt,
    );
    if (!calendar) return null;

    if (data.name !== undefined) calendar.name = data.name;
    if (data.description !== undefined) calendar.description = data.description;
    if (data.color !== undefined) calendar.color = data.color;
    if (data.settings !== undefined) calendar.settings = data.settings;

    return calendar;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const calendar = this.items.find(
      (item) =>
        item.id.toString() === id &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    if (calendar) calendar.delete();
  }
}
