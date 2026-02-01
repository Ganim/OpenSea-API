import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { PlanTier } from '@/entities/core/plan';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type PlanDTO, planToDTO } from '@/mappers/core/tenant/plan-to-dto';
import type { PlansRepository } from '@/repositories/core/plans-repository';

interface UpdatePlanUseCaseRequest {
  planId: string;
  name?: string;
  tier?: PlanTier;
  description?: string | null;
  price?: number;
  isActive?: boolean;
  maxUsers?: number;
  maxWarehouses?: number;
  maxProducts?: number;
}

interface UpdatePlanUseCaseResponse {
  plan: PlanDTO;
}

export class UpdatePlanUseCase {
  constructor(private plansRepository: PlansRepository) {}

  async execute({
    planId,
    name,
    tier,
    description,
    price,
    isActive,
    maxUsers,
    maxWarehouses,
    maxProducts,
  }: UpdatePlanUseCaseRequest): Promise<UpdatePlanUseCaseResponse> {
    const existingPlan = await this.plansRepository.findById(
      new UniqueEntityID(planId),
    );

    if (!existingPlan) {
      throw new ResourceNotFoundError('Plan not found');
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError('Plan name cannot be empty');
    }

    if (name !== undefined && name.trim() !== existingPlan.name) {
      const planWithSameName = await this.plansRepository.findByName(
        name.trim(),
      );

      if (planWithSameName) {
        throw new BadRequestError(
          `A plan with the name "${name.trim()}" already exists`,
        );
      }
    }

    const updatedPlan = await this.plansRepository.update({
      id: new UniqueEntityID(planId),
      ...(name !== undefined && { name: name.trim() }),
      ...(tier !== undefined && { tier }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(isActive !== undefined && { isActive }),
      ...(maxUsers !== undefined && { maxUsers }),
      ...(maxWarehouses !== undefined && { maxWarehouses }),
      ...(maxProducts !== undefined && { maxProducts }),
    });

    if (!updatedPlan) {
      throw new ResourceNotFoundError('Plan not found');
    }

    return { plan: planToDTO(updatedPlan) };
  }
}
