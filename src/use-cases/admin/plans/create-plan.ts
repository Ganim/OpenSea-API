import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { PlanTier } from '@/entities/core/plan';
import { type PlanDTO, planToDTO } from '@/mappers/core/tenant/plan-to-dto';
import type { PlansRepository } from '@/repositories/core/plans-repository';

interface CreatePlanUseCaseRequest {
  name: string;
  tier?: PlanTier;
  description?: string | null;
  price?: number;
  isActive?: boolean;
  maxUsers?: number;
  maxWarehouses?: number;
  maxProducts?: number;
}

interface CreatePlanUseCaseResponse {
  plan: PlanDTO;
}

export class CreatePlanUseCase {
  constructor(private plansRepository: PlansRepository) {}

  async execute({
    name,
    tier,
    description,
    price,
    isActive,
    maxUsers,
    maxWarehouses,
    maxProducts,
  }: CreatePlanUseCaseRequest): Promise<CreatePlanUseCaseResponse> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Plan name cannot be empty');
    }

    const existingPlanWithSameName = await this.plansRepository.findByName(
      name.trim(),
    );

    if (existingPlanWithSameName) {
      throw new BadRequestError(
        `A plan with the name "${name.trim()}" already exists`,
      );
    }

    const createdPlan = await this.plansRepository.create({
      name: name.trim(),
      tier,
      description,
      price,
      isActive,
      maxUsers,
      maxWarehouses,
      maxProducts,
    });

    return { plan: planToDTO(createdPlan) };
  }
}
