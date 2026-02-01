import { PlanModule } from '@/entities/core/plan-module';
import type { SystemModule } from '@/entities/core/plan-module';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PlanModulesRepository } from '../plan-modules-repository';

export class InMemoryPlanModulesRepository implements PlanModulesRepository {
  public items: PlanModule[] = [];

  async findByPlanId(planId: UniqueEntityID): Promise<PlanModule[]> {
    return this.items.filter((pm) => pm.planId.equals(planId));
  }

  async setModules(
    planId: UniqueEntityID,
    modules: string[],
  ): Promise<PlanModule[]> {
    this.items = this.items.filter((pm) => !pm.planId.equals(planId));

    const createdModules = modules.map((module) =>
      PlanModule.create({
        planId,
        module: module as SystemModule,
      }),
    );

    this.items.push(...createdModules);

    return createdModules;
  }

  async deleteByPlanId(planId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((pm) => !pm.planId.equals(planId));
  }
}
