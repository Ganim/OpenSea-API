import type { EmployeeKudos } from '@/entities/hr/employee-kudos';

export interface EmployeeKudosDTO {
  id: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  message: string;
  category: string;
  isPublic: boolean;
  isPinned: boolean;
  pinnedAt: Date | null;
  pinnedBy: string | null;
  createdAt: Date;
}

export function employeeKudosToDTO(kudos: EmployeeKudos): EmployeeKudosDTO {
  return {
    id: kudos.id.toString(),
    fromEmployeeId: kudos.fromEmployeeId.toString(),
    toEmployeeId: kudos.toEmployeeId.toString(),
    message: kudos.message,
    category: kudos.category,
    isPublic: kudos.isPublic,
    isPinned: kudos.isPinned,
    pinnedAt: kudos.pinnedAt ?? null,
    pinnedBy: kudos.pinnedBy ? kudos.pinnedBy.toString() : null,
    createdAt: kudos.createdAt,
  };
}
