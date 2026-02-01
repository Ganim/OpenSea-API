import type { PlanModule } from '@/entities/core/plan-module';

export interface PlanModuleDTO {
  id: string;
  planId: string;
  module: string;
}

export function planModuleToDTO(planModule: PlanModule): PlanModuleDTO {
  return {
    id: planModule.planModuleId.toString(),
    planId: planModule.planId.toString(),
    module: planModule.module,
  };
}
