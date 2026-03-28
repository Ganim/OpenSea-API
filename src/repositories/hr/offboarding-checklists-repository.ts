import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';

export interface FindManyOffboardingChecklistsParams {
  tenantId: string;
  page: number;
  perPage: number;
  employeeId?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED';
  search?: string;
}

export interface FindManyOffboardingChecklistsResult {
  checklists: OffboardingChecklist[];
  total: number;
}

export interface OffboardingChecklistsRepository {
  create(checklist: OffboardingChecklist): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OffboardingChecklist | null>;
  findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OffboardingChecklist | null>;
  findMany(
    params: FindManyOffboardingChecklistsParams,
  ): Promise<FindManyOffboardingChecklistsResult>;
  save(checklist: OffboardingChecklist): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
