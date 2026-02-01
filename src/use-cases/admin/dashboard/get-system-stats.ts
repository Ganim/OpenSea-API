import type { PlansRepository } from '@/repositories/core/plans-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface GetSystemStatsUseCaseResponse {
  totalTenants: number;
  totalPlans: number;
  activePlans: number;
}

export class GetSystemStatsUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private plansRepository: PlansRepository,
  ) {}

  async execute(): Promise<GetSystemStatsUseCaseResponse> {
    const [totalTenants, allPlans] = await Promise.all([
      this.tenantsRepository.countAll(),
      this.plansRepository.findMany(),
    ]);

    const activePlans = allPlans.filter((plan) => plan.isActive).length;

    return {
      totalTenants,
      totalPlans: allPlans.length,
      activePlans,
    };
  }
}
