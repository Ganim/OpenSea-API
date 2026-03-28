import type {
  OnboardingChecklist,
  OnboardingChecklistItem,
} from '@/entities/hr/onboarding-checklist';

export interface OnboardingChecklistDTO {
  id: string;
  tenantId: string;
  employeeId: string;
  title: string;
  items: OnboardingChecklistItem[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export function onboardingChecklistToDTO(
  checklist: OnboardingChecklist,
): OnboardingChecklistDTO {
  return {
    id: checklist.id.toString(),
    tenantId: checklist.tenantId.toString(),
    employeeId: checklist.employeeId.toString(),
    title: checklist.title,
    items: checklist.items,
    progress: checklist.progress,
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt,
  };
}
