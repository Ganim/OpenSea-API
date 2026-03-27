import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';

export interface OnboardingChecklistsRepository {
  create(checklist: OnboardingChecklist): Promise<void>;
  findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OnboardingChecklist | null>;
  save(checklist: OnboardingChecklist): Promise<void>;
}
