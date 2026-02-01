import { type PlanDTO, planToDTO } from '@/mappers/core/tenant/plan-to-dto';
import type { PlansRepository } from '@/repositories/core/plans-repository';

interface ListPlansUseCaseResponse {
  plans: PlanDTO[];
}

export class ListPlansUseCase {
  constructor(private plansRepository: PlansRepository) {}

  async execute(): Promise<ListPlansUseCaseResponse> {
    const allPlans = await this.plansRepository.findMany();

    return { plans: allPlans.map(planToDTO) };
  }
}
