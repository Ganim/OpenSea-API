import { PlanModule } from '@/entities/core/plan-module';
import type { SystemModule } from '@/entities/core/plan-module';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { PlanModulesRepository } from '../plan-modules-repository';

export class PrismaPlanModulesRepository implements PlanModulesRepository {
  async findByPlanId(planId: UniqueEntityID): Promise<PlanModule[]> {
    const planModulesDb = await prisma.planModule.findMany({
      where: { planId: planId.toString() },
    });

    return planModulesDb.map((pm) =>
      PlanModule.create(
        {
          planId: new UniqueEntityID(pm.planId),
          module: pm.module as SystemModule,
        },
        new UniqueEntityID(pm.id),
      ),
    );
  }

  async setModules(
    planId: UniqueEntityID,
    modules: string[],
  ): Promise<PlanModule[]> {
    await prisma.planModule.deleteMany({
      where: { planId: planId.toString() },
    });

    await prisma.planModule.createMany({
      data: modules.map((module) => ({
        planId: planId.toString(),
        module: module as SystemModule,
      })),
    });

    return this.findByPlanId(planId);
  }

  async deleteByPlanId(planId: UniqueEntityID): Promise<void> {
    await prisma.planModule.deleteMany({
      where: { planId: planId.toString() },
    });
  }
}
