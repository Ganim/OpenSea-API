import type { PlanModule } from '@/entities/core/plan-module';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface PlanModulesRepository {
  findByPlanId(planId: UniqueEntityID): Promise<PlanModule[]>;
  setModules(planId: UniqueEntityID, modules: string[]): Promise<PlanModule[]>;
  deleteByPlanId(planId: UniqueEntityID): Promise<void>;
}
