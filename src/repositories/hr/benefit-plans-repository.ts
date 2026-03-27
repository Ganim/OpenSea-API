import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitPlan } from '@/entities/hr/benefit-plan';

export interface CreateBenefitPlanSchema {
  tenantId: string;
  name: string;
  type: string;
  provider?: string;
  policyNumber?: string;
  isActive?: boolean;
  rules?: Record<string, unknown>;
  description?: string;
}

export interface UpdateBenefitPlanSchema {
  id: UniqueEntityID;
  name?: string;
  type?: string;
  provider?: string;
  policyNumber?: string;
  isActive?: boolean;
  rules?: Record<string, unknown>;
  description?: string;
}

export interface FindBenefitPlanFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface BenefitPlansRepository {
  create(data: CreateBenefitPlanSchema): Promise<BenefitPlan>;
  findById(id: UniqueEntityID, tenantId: string): Promise<BenefitPlan | null>;
  findMany(
    tenantId: string,
    filters?: FindBenefitPlanFilters,
  ): Promise<{ benefitPlans: BenefitPlan[]; total: number }>;
  update(data: UpdateBenefitPlanSchema): Promise<BenefitPlan | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
