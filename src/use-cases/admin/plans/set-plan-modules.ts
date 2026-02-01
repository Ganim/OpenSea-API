import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { SystemModule } from '@/entities/core/plan-module';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type PlanModuleDTO,
  planModuleToDTO,
} from '@/mappers/core/tenant/plan-module-to-dto';
import type { PlanModulesRepository } from '@/repositories/core/plan-modules-repository';
import type { PlansRepository } from '@/repositories/core/plans-repository';

const VALID_SYSTEM_MODULES: SystemModule[] = [
  'CORE',
  'STOCK',
  'SALES',
  'HR',
  'PAYROLL',
  'REPORTS',
  'AUDIT',
  'REQUESTS',
  'NOTIFICATIONS',
];

interface SetPlanModulesUseCaseRequest {
  planId: string;
  modules: string[];
}

interface SetPlanModulesUseCaseResponse {
  modules: PlanModuleDTO[];
}

export class SetPlanModulesUseCase {
  constructor(
    private plansRepository: PlansRepository,
    private planModulesRepository: PlanModulesRepository,
  ) {}

  async execute({
    planId,
    modules,
  }: SetPlanModulesUseCaseRequest): Promise<SetPlanModulesUseCaseResponse> {
    const existingPlan = await this.plansRepository.findById(
      new UniqueEntityID(planId),
    );

    if (!existingPlan) {
      throw new ResourceNotFoundError('Plan not found');
    }

    const invalidModules = modules.filter(
      (m) => !VALID_SYSTEM_MODULES.includes(m as SystemModule),
    );

    if (invalidModules.length > 0) {
      throw new BadRequestError(
        `Invalid modules: ${invalidModules.join(', ')}`,
      );
    }

    const uniqueModules = [...new Set(modules)];

    const updatedModules = await this.planModulesRepository.setModules(
      new UniqueEntityID(planId),
      uniqueModules,
    );

    return { modules: updatedModules.map(planModuleToDTO) };
  }
}
