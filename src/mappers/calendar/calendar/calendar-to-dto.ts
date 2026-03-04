import type { Calendar } from '@/entities/calendar/calendar';

export interface CalendarAccessDTO {
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export interface CalendarDTO {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  color: string | null;
  type: string;
  ownerId: string | null;
  systemModule: string | null;
  isDefault: boolean;
  access: CalendarAccessDTO;
  createdAt: Date;
  updatedAt: Date | null;
}

export function calendarToDTO(
  calendar: Calendar,
  access: CalendarAccessDTO,
): CalendarDTO {
  return {
    id: calendar.id.toString(),
    tenantId: calendar.tenantId.toString(),
    name: calendar.name,
    description: calendar.description,
    color: calendar.color,
    type: calendar.type,
    ownerId: calendar.ownerId,
    systemModule: calendar.systemModule,
    isDefault: calendar.isDefault,
    access,
    createdAt: calendar.createdAt,
    updatedAt: calendar.updatedAt,
  };
}
