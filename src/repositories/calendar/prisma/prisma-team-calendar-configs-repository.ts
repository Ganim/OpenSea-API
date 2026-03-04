import { prisma } from '@/lib/prisma';
import type { TeamCalendarConfig } from '@prisma/generated/client.js';
import type {
  TeamCalendarConfigsRepository,
  TeamCalendarConfigData,
  CreateTeamCalendarConfigSchema,
  UpdateTeamCalendarConfigSchema,
} from '../team-calendar-configs-repository';

function toData(raw: TeamCalendarConfig): TeamCalendarConfigData {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    teamId: raw.teamId,
    calendarId: raw.calendarId,
    ownerCanRead: raw.ownerCanRead,
    ownerCanCreate: raw.ownerCanCreate,
    ownerCanEdit: raw.ownerCanEdit,
    ownerCanDelete: raw.ownerCanDelete,
    ownerCanShare: raw.ownerCanShare,
    adminCanRead: raw.adminCanRead,
    adminCanCreate: raw.adminCanCreate,
    adminCanEdit: raw.adminCanEdit,
    adminCanDelete: raw.adminCanDelete,
    adminCanShare: raw.adminCanShare,
    memberCanRead: raw.memberCanRead,
    memberCanCreate: raw.memberCanCreate,
    memberCanEdit: raw.memberCanEdit,
    memberCanDelete: raw.memberCanDelete,
    memberCanShare: raw.memberCanShare,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class PrismaTeamCalendarConfigsRepository
  implements TeamCalendarConfigsRepository
{
  async create(
    data: CreateTeamCalendarConfigSchema,
  ): Promise<TeamCalendarConfigData> {
    const raw = await prisma.teamCalendarConfig.create({ data });
    return toData(raw);
  }

  async findByTeamAndCalendar(
    teamId: string,
    calendarId: string,
  ): Promise<TeamCalendarConfigData | null> {
    const raw = await prisma.teamCalendarConfig.findUnique({
      where: { teamId_calendarId: { teamId, calendarId } },
    });
    return raw ? toData(raw) : null;
  }

  async findByCalendar(calendarId: string): Promise<TeamCalendarConfigData[]> {
    const raws = await prisma.teamCalendarConfig.findMany({
      where: { calendarId },
    });
    return raws.map(toData);
  }

  async findByTeam(teamId: string): Promise<TeamCalendarConfigData[]> {
    const raws = await prisma.teamCalendarConfig.findMany({
      where: { teamId },
    });
    return raws.map(toData);
  }

  async update(
    data: UpdateTeamCalendarConfigSchema,
  ): Promise<TeamCalendarConfigData | null> {
    const { teamId, calendarId, ...updateData } = data;
    const raw = await prisma.teamCalendarConfig.update({
      where: { teamId_calendarId: { teamId, calendarId } },
      data: updateData,
    });
    return toData(raw);
  }

  async delete(teamId: string, calendarId: string): Promise<void> {
    await prisma.teamCalendarConfig.delete({
      where: { teamId_calendarId: { teamId, calendarId } },
    });
  }
}
