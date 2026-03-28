import type {
  OffboardingChecklist,
  OffboardingChecklistItem,
} from '@/entities/hr/offboarding-checklist';

export interface OffboardingChecklistDTO {
  id: string;
  tenantId: string;
  employeeId: string;
  terminationId: string | null;
  title: string;
  items: OffboardingChecklistItem[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export function offboardingChecklistToDTO(
  checklist: OffboardingChecklist,
): OffboardingChecklistDTO {
  return {
    id: checklist.id.toString(),
    tenantId: checklist.tenantId.toString(),
    employeeId: checklist.employeeId.toString(),
    terminationId: checklist.terminationId?.toString() ?? null,
    title: checklist.title,
    items: checklist.items,
    progress: checklist.progress,
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt,
  };
}
