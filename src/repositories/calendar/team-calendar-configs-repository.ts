export interface TeamCalendarConfigData {
  id: string;
  tenantId: string;
  teamId: string;
  calendarId: string;
  ownerCanRead: boolean;
  ownerCanCreate: boolean;
  ownerCanEdit: boolean;
  ownerCanDelete: boolean;
  ownerCanShare: boolean;
  ownerCanManage: boolean;
  adminCanRead: boolean;
  adminCanCreate: boolean;
  adminCanEdit: boolean;
  adminCanDelete: boolean;
  adminCanShare: boolean;
  adminCanManage: boolean;
  memberCanRead: boolean;
  memberCanCreate: boolean;
  memberCanEdit: boolean;
  memberCanDelete: boolean;
  memberCanShare: boolean;
  memberCanManage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamCalendarConfigSchema {
  tenantId: string;
  teamId: string;
  calendarId: string;
  ownerCanRead?: boolean;
  ownerCanCreate?: boolean;
  ownerCanEdit?: boolean;
  ownerCanDelete?: boolean;
  ownerCanShare?: boolean;
  ownerCanManage?: boolean;
  adminCanRead?: boolean;
  adminCanCreate?: boolean;
  adminCanEdit?: boolean;
  adminCanDelete?: boolean;
  adminCanShare?: boolean;
  adminCanManage?: boolean;
  memberCanRead?: boolean;
  memberCanCreate?: boolean;
  memberCanEdit?: boolean;
  memberCanDelete?: boolean;
  memberCanShare?: boolean;
  memberCanManage?: boolean;
}

export interface UpdateTeamCalendarConfigSchema {
  teamId: string;
  calendarId: string;
  ownerCanRead?: boolean;
  ownerCanCreate?: boolean;
  ownerCanEdit?: boolean;
  ownerCanDelete?: boolean;
  ownerCanShare?: boolean;
  ownerCanManage?: boolean;
  adminCanRead?: boolean;
  adminCanCreate?: boolean;
  adminCanEdit?: boolean;
  adminCanDelete?: boolean;
  adminCanShare?: boolean;
  adminCanManage?: boolean;
  memberCanRead?: boolean;
  memberCanCreate?: boolean;
  memberCanEdit?: boolean;
  memberCanDelete?: boolean;
  memberCanShare?: boolean;
  memberCanManage?: boolean;
}

export interface TeamCalendarConfigsRepository {
  create(data: CreateTeamCalendarConfigSchema): Promise<TeamCalendarConfigData>;
  findByTeamAndCalendar(
    teamId: string,
    calendarId: string,
  ): Promise<TeamCalendarConfigData | null>;
  findByCalendar(calendarId: string): Promise<TeamCalendarConfigData[]>;
  findByTeam(teamId: string): Promise<TeamCalendarConfigData[]>;
  update(
    data: UpdateTeamCalendarConfigSchema,
  ): Promise<TeamCalendarConfigData | null>;
  delete(teamId: string, calendarId: string): Promise<void>;
}
