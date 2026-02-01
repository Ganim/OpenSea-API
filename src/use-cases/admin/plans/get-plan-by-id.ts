import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type PlanModuleDTO,
  planModuleToDTO,
} from '@/mappers/core/tenant/plan-module-to-dto';
import { type PlanDTO, planToDTO } from '@/mappers/core/tenant/plan-to-dto';
import type { PlanModulesRepository } from '@/repositories/core/plan-modules-repository';
import type { PlansRepository } from '@/repositories/core/plans-repository';

interface GetPlanByIdUseCaseRequest {
  planId: string;
}

interface GetPlanByIdUseCaseResponse {
  plan: PlanDTO;
  modules: PlanModuleDTO[];
}

export class GetPlanByIdUseCase {
  constructor(
    private plansRepository: PlansRepository,
    private planModulesRepository: PlanModulesRepository,
  ) {}

  async execute({
    planId,
  }: GetPlanByIdUseCaseRequest): Promise<GetPlanByIdUseCaseResponse> {
    const existingPlan = await this.plansRepository.findById(
      new UniqueEntityID(planId),
    );

    if (!existingPlan) {
      throw new ResourceNotFoundError('Plan not found');
    }

    const planModules = await this.planModulesRepository.findByPlanId(
      existingPlan.planId,
    );

    return {
      plan: planToDTO(existingPlan),
      modules: planModules.map(planModuleToDTO),
    };
  }
}
