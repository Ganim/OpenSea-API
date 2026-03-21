import type { SkillPricing } from '@/entities/core/skill-pricing';
import type { SkillPricingRepository } from '@/repositories/core/skill-pricing-repository';

interface ListSkillPricingUseCaseRequest {
  pricingType?: string;
}

interface ListSkillPricingUseCaseResponse {
  pricing: SkillPricing[];
}

export class ListSkillPricingUseCase {
  constructor(private skillPricingRepository: SkillPricingRepository) {}

  async execute({
    pricingType,
  }: ListSkillPricingUseCaseRequest): Promise<ListSkillPricingUseCaseResponse> {
    const allPricingEntries = pricingType
      ? await this.skillPricingRepository.findByPricingType(pricingType)
      : await this.skillPricingRepository.findAll();

    return { pricing: allPricingEntries };
  }
}
