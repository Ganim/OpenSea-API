import type { OnboardingChecklist, OnboardingChecklistItem } from '@/entities/hr/onboarding-checklist';

export interface OnboardingChecklistDTO {
  id: string;
  employeeId: string;
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
    employeeId: checklist.employeeId.toString(),
    items: checklist.items,
    progress: checklist.progress,
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt,
  };
}
