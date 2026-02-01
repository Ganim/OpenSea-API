import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type PlanDTO, planToDTO } from '@/mappers/core/tenant/plan-to-dto';
import type { PlansRepository } from '@/repositories/core/plans-repository';

interface DeletePlanUseCaseRequest {
  planId: string;
}

interface DeletePlanUseCaseResponse {
  plan: PlanDTO;
}

export class DeletePlanUseCase {
  constructor(private plansRepository: PlansRepository) {}

  async execute({
    planId,
  }: DeletePlanUseCaseRequest): Promise<DeletePlanUseCaseResponse> {
    const existingPlan = await this.plansRepository.findById(
      new UniqueEntityID(planId),
    );

    if (!existingPlan) {
      throw new ResourceNotFoundError('Plan not found');
    }

    const deactivatedPlan = await this.plansRepository.update({
      id: new UniqueEntityID(planId),
      isActive: false,
    });

    if (!deactivatedPlan) {
      throw new ResourceNotFoundError('Plan not found');
    }

    return { plan: planToDTO(deactivatedPlan) };
  }
}
