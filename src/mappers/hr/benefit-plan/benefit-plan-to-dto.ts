import type { BenefitPlan } from '@/entities/hr/benefit-plan';

export interface BenefitPlanDTO {
  id: string;
  name: string;
  type: string;
  provider: string | null;
  policyNumber: string | null;
  isActive: boolean;
  rules: Record<string, unknown> | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function benefitPlanToDTO(plan: BenefitPlan): BenefitPlanDTO {
  return {
    id: plan.id.toString(),
    name: plan.name,
    type: plan.type,
    provider: plan.provider ?? null,
    policyNumber: plan.policyNumber ?? null,
    isActive: plan.isActive,
    rules: plan.rules ?? null,
    description: plan.description ?? null,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}
