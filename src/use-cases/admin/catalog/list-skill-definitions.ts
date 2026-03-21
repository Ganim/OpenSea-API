import type { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import type { SkillPricingRepository } from '@/repositories/core/skill-pricing-repository';
import type { SystemSkillDefinitionsRepository } from '@/repositories/core/system-skill-definitions-repository';
import type { SkillPricing } from '@/entities/core/skill-pricing';

interface ListSkillDefinitionsUseCaseRequest {
  module?: string;
}

export interface SkillDefinitionWithPricing {
  skill: SystemSkillDefinition;
  pricing: SkillPricing | null;
}

interface ListSkillDefinitionsUseCaseResponse {
  skills: SkillDefinitionWithPricing[];
}

export class ListSkillDefinitionsUseCase {
  constructor(
    private skillDefinitionsRepository: SystemSkillDefinitionsRepository,
    private skillPricingRepository: SkillPricingRepository,
  ) {}

  async execute({
    module,
  }: ListSkillDefinitionsUseCaseRequest): Promise<ListSkillDefinitionsUseCaseResponse> {
    const allSkillDefinitions = module
      ? await this.skillDefinitionsRepository.findByModule(module)
      : await this.skillDefinitionsRepository.findAll();

    const skillsWithPricing: SkillDefinitionWithPricing[] = await Promise.all(
      allSkillDefinitions.map(async (skill) => {
        const pricing = await this.skillPricingRepository.findBySkillCode(
          skill.code,
        );

        return { skill, pricing };
      }),
    );

    return { skills: skillsWithPricing };
  }
}
