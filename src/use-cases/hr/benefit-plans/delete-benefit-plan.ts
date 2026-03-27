import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitPlan } from '@/entities/hr/benefit-plan';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';

export interface DeleteBenefitPlanRequest {
  tenantId: string;
  benefitPlanId: string;
}

export interface DeleteBenefitPlanResponse {
  benefitPlan: BenefitPlan;
}

export class DeleteBenefitPlanUseCase {
  constructor(private benefitPlansRepository: BenefitPlansRepository) {}

  async execute(
    request: DeleteBenefitPlanRequest,
  ): Promise<DeleteBenefitPlanResponse> {
    const { tenantId, benefitPlanId } = request;

    const benefitPlan = await this.benefitPlansRepository.findById(
      new UniqueEntityID(benefitPlanId),
      tenantId,
    );

    if (!benefitPlan) {
      throw new ResourceNotFoundError('Plano de benefício não encontrado');
    }

    // Soft delete: deactivate instead of hard delete
    benefitPlan.deactivate();

    await this.benefitPlansRepository.update({
      id: new UniqueEntityID(benefitPlanId),
      isActive: false,
    });

    return { benefitPlan };
  }
}
