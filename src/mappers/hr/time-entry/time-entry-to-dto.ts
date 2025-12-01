import type { TimeEntry } from '@/entities/hr/time-entry';

export interface TimeEntryDTO {
  id: string;
  employeeId: string;
  entryType: string;
  timestamp: Date;
  latitude?: number | null;
  longitude?: number | null;
  ipAddress?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export function timeEntryToDTO(timeEntry: TimeEntry): TimeEntryDTO {
  return {
    id: timeEntry.id.toString(),
    employeeId: timeEntry.employeeId.toString(),
    entryType: timeEntry.entryType.value,
    timestamp: timeEntry.timestamp,
    latitude: timeEntry.latitude ?? null,
    longitude: timeEntry.longitude ?? null,
    ipAddress: timeEntry.ipAddress ?? null,
    notes: timeEntry.notes ?? null,
    createdAt: timeEntry.createdAt,
  };
}
