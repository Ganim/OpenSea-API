import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';

export interface FindManyOnboardingChecklistsParams {
  tenantId: string;
  page: number;
  perPage: number;
  employeeId?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED';
  search?: string;
}

export interface FindManyOnboardingChecklistsResult {
  checklists: OnboardingChecklist[];
  total: number;
}

export interface OnboardingChecklistsRepository {
  create(checklist: OnboardingChecklist): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OnboardingChecklist | null>;
  findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OnboardingChecklist | null>;
  findMany(
    params: FindManyOnboardingChecklistsParams,
  ): Promise<FindManyOnboardingChecklistsResult>;
  save(checklist: OnboardingChecklist): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
