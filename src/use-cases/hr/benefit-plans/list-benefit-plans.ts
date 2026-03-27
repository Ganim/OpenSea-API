import type { BenefitPlan } from '@/entities/hr/benefit-plan';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';

export interface ListBenefitPlansRequest {
  tenantId: string;
  type?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ListBenefitPlansResponse {
  benefitPlans: BenefitPlan[];
  total: number;
}

export class ListBenefitPlansUseCase {
  constructor(private benefitPlansRepository: BenefitPlansRepository) {}

  async execute(
    request: ListBenefitPlansRequest,
  ): Promise<ListBenefitPlansResponse> {
    const { tenantId, type, isActive, search, page, perPage } = request;

    const { benefitPlans, total } = await this.benefitPlansRepository.findMany(
      tenantId,
      {
        type,
        isActive,
        search,
        page,
        perPage,
      },
    );

    return { benefitPlans, total };
  }
}
