import { randomUUID } from 'node:crypto';
import type {
  TeamCalendarConfigsRepository,
  TeamCalendarConfigData,
  CreateTeamCalendarConfigSchema,
  UpdateTeamCalendarConfigSchema,
} from '../team-calendar-configs-repository';

export class InMemoryTeamCalendarConfigsRepository
  implements TeamCalendarConfigsRepository
{
  public items: TeamCalendarConfigData[] = [];

  async create(
    data: CreateTeamCalendarConfigSchema,
  ): Promise<TeamCalendarConfigData> {
    const config: TeamCalendarConfigData = {
      id: randomUUID(),
      tenantId: data.tenantId,
      teamId: data.teamId,
      calendarId: data.calendarId,
      ownerCanRead: data.ownerCanRead ?? true,
      ownerCanCreate: data.ownerCanCreate ?? true,
      ownerCanEdit: data.ownerCanEdit ?? true,
      ownerCanDelete: data.ownerCanDelete ?? true,
      ownerCanShare: data.ownerCanShare ?? true,
      adminCanRead: data.adminCanRead ?? true,
      adminCanCreate: data.adminCanCreate ?? true,
      adminCanEdit: data.adminCanEdit ?? true,
      adminCanDelete: data.adminCanDelete ?? false,
      adminCanShare: data.adminCanShare ?? false,
      memberCanRead: data.memberCanRead ?? true,
      memberCanCreate: data.memberCanCreate ?? false,
      memberCanEdit: data.memberCanEdit ?? false,
      memberCanDelete: data.memberCanDelete ?? false,
      memberCanShare: data.memberCanShare ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.push(config);
    return config;
  }

  async findByTeamAndCalendar(
    teamId: string,
    calendarId: string,
  ): Promise<TeamCalendarConfigData | null> {
    return (
      this.items.find(
        (c) => c.teamId === teamId && c.calendarId === calendarId,
      ) ?? null
    );
  }

  async findByCalendar(calendarId: string): Promise<TeamCalendarConfigData[]> {
    return this.items.filter((c) => c.calendarId === calendarId);
  }

  async findByTeam(teamId: string): Promise<TeamCalendarConfigData[]> {
    return this.items.filter((c) => c.teamId === teamId);
  }

  async update(
    data: UpdateTeamCalendarConfigSchema,
  ): Promise<TeamCalendarConfigData | null> {
    const idx = this.items.findIndex(
      (c) => c.teamId === data.teamId && c.calendarId === data.calendarId,
    );
    if (idx === -1) return null;

    const config = this.items[idx];
    const { teamId: _, calendarId: __, ...updates } = data;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        (config as unknown as Record<string, unknown>)[key] = value;
      }
    }
    config.updatedAt = new Date();

    return config;
  }

  async delete(teamId: string, calendarId: string): Promise<void> {
    const idx = this.items.findIndex(
      (c) => c.teamId === teamId && c.calendarId === calendarId,
    );
    if (idx !== -1) this.items.splice(idx, 1);
  }
}
