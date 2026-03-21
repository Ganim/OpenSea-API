import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SkillPricing } from '@/entities/core/skill-pricing';
import type { SkillPricingRepository } from '@/repositories/core/skill-pricing-repository';
import type { SystemSkillDefinitionsRepository } from '@/repositories/core/system-skill-definitions-repository';

interface UpsertSkillPricingUseCaseRequest {
  skillCode: string;
  pricingType: string;
  flatPrice?: number;
  unitPrice?: number;
  unitMetric?: string;
  unitMetricLabel?: string;
  usageIncluded?: number;
  usagePrice?: number;
  usageMetric?: string;
  usageMetricLabel?: string;
  annualDiscount?: number;
}

interface UpsertSkillPricingUseCaseResponse {
  pricing: SkillPricing;
}

const VALID_PRICING_TYPES = ['FLAT', 'PER_UNIT', 'USAGE'] as const;

export class UpsertSkillPricingUseCase {
  constructor(
    private skillDefinitionsRepository: SystemSkillDefinitionsRepository,
    private skillPricingRepository: SkillPricingRepository,
  ) {}

  async execute({
    skillCode,
    pricingType,
    flatPrice,
    unitPrice,
    unitMetric,
    unitMetricLabel,
    usageIncluded,
    usagePrice,
    usageMetric,
    usageMetricLabel,
    annualDiscount,
  }: UpsertSkillPricingUseCaseRequest): Promise<UpsertSkillPricingUseCaseResponse> {
    const skillDefinition =
      await this.skillDefinitionsRepository.findByCode(skillCode);

    if (!skillDefinition) {
      throw new ResourceNotFoundError(
        `Skill definition with code "${skillCode}" not found`,
      );
    }

    if (
      !VALID_PRICING_TYPES.includes(
        pricingType as (typeof VALID_PRICING_TYPES)[number],
      )
    ) {
      throw new BadRequestError(
        `Invalid pricing type "${pricingType}". Must be one of: ${VALID_PRICING_TYPES.join(', ')}`,
      );
    }

    this.validatePricingTypeConstraints(pricingType, {
      flatPrice,
      unitPrice,
      unitMetric,
      usageIncluded,
      usagePrice,
      usageMetric,
    });

    const existingPricing =
      await this.skillPricingRepository.findBySkillCode(skillCode);

    const skillPricing = SkillPricing.create(
      {
        skillCode,
        pricingType,
        flatPrice: flatPrice ?? null,
        unitPrice: unitPrice ?? null,
        unitMetric: unitMetric ?? null,
        unitMetricLabel: unitMetricLabel ?? null,
        usageIncluded: usageIncluded ?? null,
        usagePrice: usagePrice ?? null,
        usageMetric: usageMetric ?? null,
        usageMetricLabel: usageMetricLabel ?? null,
        annualDiscount: annualDiscount ?? null,
      },
      existingPricing?.id,
    );

    await this.skillPricingRepository.upsert(skillPricing);

    return { pricing: skillPricing };
  }

  private validatePricingTypeConstraints(
    pricingType: string,
    fields: {
      flatPrice?: number;
      unitPrice?: number;
      unitMetric?: string;
      usageIncluded?: number;
      usagePrice?: number;
      usageMetric?: string;
    },
  ): void {
    switch (pricingType) {
      case 'FLAT':
        if (fields.flatPrice === undefined || fields.flatPrice === null) {
          throw new BadRequestError(
            'FLAT pricing type requires flatPrice to be provided',
          );
        }
        break;

      case 'PER_UNIT':
        if (fields.unitPrice === undefined || fields.unitPrice === null) {
          throw new BadRequestError(
            'PER_UNIT pricing type requires unitPrice to be provided',
          );
        }
        if (!fields.unitMetric) {
          throw new BadRequestError(
            'PER_UNIT pricing type requires unitMetric to be provided',
          );
        }
        break;

      case 'USAGE':
        if (
          fields.usageIncluded === undefined ||
          fields.usageIncluded === null
        ) {
          throw new BadRequestError(
            'USAGE pricing type requires usageIncluded to be provided',
          );
        }
        if (fields.usagePrice === undefined || fields.usagePrice === null) {
          throw new BadRequestError(
            'USAGE pricing type requires usagePrice to be provided',
          );
        }
        if (!fields.usageMetric) {
          throw new BadRequestError(
            'USAGE pricing type requires usageMetric to be provided',
          );
        }
        break;
    }
  }
}
