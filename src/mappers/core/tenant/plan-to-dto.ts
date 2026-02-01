import type { Plan } from '@/entities/core/plan';

export interface PlanDTO {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  price: number;
  isActive: boolean;
  maxUsers: number;
  maxWarehouses: number;
  maxProducts: number;
  createdAt: Date;
  updatedAt: Date;
}

export function planToDTO(plan: Plan): PlanDTO {
  return {
    id: plan.planId.toString(),
    name: plan.name,
    tier: plan.tier,
    description: plan.description,
    price: plan.price,
    isActive: plan.isActive,
    maxUsers: plan.maxUsers,
    maxWarehouses: plan.maxWarehouses,
    maxProducts: plan.maxProducts,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}
