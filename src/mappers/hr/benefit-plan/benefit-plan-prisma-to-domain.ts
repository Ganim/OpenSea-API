import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitPlan as PrismaBenefitPlan } from '@prisma/generated/client.js';

export function mapBenefitPlanPrismaToDomain(plan: PrismaBenefitPlan) {
  return {
    tenantId: new UniqueEntityID(plan.tenantId),
    name: plan.name,
    type: plan.type,
    provider: plan.provider ?? undefined,
    policyNumber: plan.policyNumber ?? undefined,
    isActive: plan.isActive,
    rules: (plan.rules as Record<string, unknown>) ?? undefined,
    description: plan.description ?? undefined,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}
