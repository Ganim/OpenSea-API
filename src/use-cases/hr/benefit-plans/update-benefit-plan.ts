import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitPlan } from '@/entities/hr/benefit-plan';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';

export interface UpdateBenefitPlanRequest {
  tenantId: string;
  benefitPlanId: string;
  name?: string;
  type?: string;
  provider?: string;
  policyNumber?: string;
  isActive?: boolean;
  rules?: Record<string, unknown>;
  description?: string;
}

export interface UpdateBenefitPlanResponse {
  benefitPlan: BenefitPlan;
}

export class UpdateBenefitPlanUseCase {
  constructor(private benefitPlansRepository: BenefitPlansRepository) {}

  async execute(
    request: UpdateBenefitPlanRequest,
  ): Promise<UpdateBenefitPlanResponse> {
    const {
      tenantId,
      benefitPlanId,
      name,
      type,
      provider,
      policyNumber,
      isActive,
      rules,
      description,
    } = request;

    const existingPlan = await this.benefitPlansRepository.findById(
      new UniqueEntityID(benefitPlanId),
      tenantId,
    );

    if (!existingPlan) {
      throw new ResourceNotFoundError('Plano de benefício não encontrado');
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError('O nome do plano de benefício é obrigatório');
    }

    const updatedPlan = await this.benefitPlansRepository.update({
      id: new UniqueEntityID(benefitPlanId),
      name: name?.trim(),
      type,
      provider: provider?.trim(),
      policyNumber: policyNumber?.trim(),
      isActive,
      rules,
      description: description?.trim(),
    });

    if (!updatedPlan) {
      throw new ResourceNotFoundError('Plano de benefício não encontrado');
    }

    return { benefitPlan: updatedPlan };
  }
}
