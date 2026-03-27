import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitPlan } from '@/entities/hr/benefit-plan';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';

export interface GetBenefitPlanRequest {
  tenantId: string;
  benefitPlanId: string;
}

export interface GetBenefitPlanResponse {
  benefitPlan: BenefitPlan;
}

export class GetBenefitPlanUseCase {
  constructor(private benefitPlansRepository: BenefitPlansRepository) {}

  async execute(
    request: GetBenefitPlanRequest,
  ): Promise<GetBenefitPlanResponse> {
    const { tenantId, benefitPlanId } = request;

    const benefitPlan = await this.benefitPlansRepository.findById(
      new UniqueEntityID(benefitPlanId),
      tenantId,
    );

    if (!benefitPlan) {
      throw new ResourceNotFoundError('Plano de benefício não encontrado');
    }

    return { benefitPlan };
  }
}
