import type { Calendar } from '@/entities/calendar/calendar';

export interface CreateCalendarSchema {
  tenantId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  type: string;
  ownerId?: string | null;
  systemModule?: string | null;
  isDefault?: boolean;
  settings?: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateCalendarSchema {
  id: string;
  tenantId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
  settings?: Record<string, unknown>;
}

export interface CalendarsRepository {
  create(data: CreateCalendarSchema): Promise<Calendar>;
  findById(id: string, tenantId: string): Promise<Calendar | null>;
  findPersonalByUser(
    userId: string,
    tenantId: string,
  ): Promise<Calendar | null>;
  findOrCreatePersonal(tenantId: string, userId: string): Promise<Calendar>;
  findByTeam(teamId: string, tenantId: string): Promise<Calendar[]>;
  findSystemByModule(
    module: string,
    tenantId: string,
  ): Promise<Calendar | null>;
  listByUser(
    userId: string,
    tenantId: string,
    teamIds: string[],
  ): Promise<Calendar[]>;
  update(data: UpdateCalendarSchema): Promise<Calendar | null>;
  softDelete(id: string, tenantId: string): Promise<void>;
}
