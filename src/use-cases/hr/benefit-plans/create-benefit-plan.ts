import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { BenefitPlan } from '@/entities/hr/benefit-plan';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';

const VALID_BENEFIT_TYPES = [
  'VT',
  'VR',
  'VA',
  'HEALTH',
  'DENTAL',
  'LIFE_INSURANCE',
  'DAYCARE',
  'PLR',
  'LOAN',
  'EDUCATION',
  'HOME_OFFICE',
  'FLEX',
] as const;

export interface CreateBenefitPlanRequest {
  tenantId: string;
  name: string;
  type: string;
  provider?: string;
  policyNumber?: string;
  rules?: Record<string, unknown>;
  description?: string;
}

export interface CreateBenefitPlanResponse {
  benefitPlan: BenefitPlan;
}

export class CreateBenefitPlanUseCase {
  constructor(private benefitPlansRepository: BenefitPlansRepository) {}

  async execute(
    request: CreateBenefitPlanRequest,
  ): Promise<CreateBenefitPlanResponse> {
    const { tenantId, name, type, provider, policyNumber, rules, description } =
      request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome do plano de benefício é obrigatório');
    }

    if (
      !VALID_BENEFIT_TYPES.includes(
        type as (typeof VALID_BENEFIT_TYPES)[number],
      )
    ) {
      throw new BadRequestError(
        `Tipo de benefício inválido. Tipos válidos: ${VALID_BENEFIT_TYPES.join(', ')}`,
      );
    }

    const benefitPlan = await this.benefitPlansRepository.create({
      tenantId,
      name: name.trim(),
      type,
      provider: provider?.trim(),
      policyNumber: policyNumber?.trim(),
      rules,
      description: description?.trim(),
    });

    return { benefitPlan };
  }
}
