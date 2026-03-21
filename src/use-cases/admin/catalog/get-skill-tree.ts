import type { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import type { SkillPricing } from '@/entities/core/skill-pricing';
import type { SkillPricingRepository } from '@/repositories/core/skill-pricing-repository';
import type { SystemSkillDefinitionsRepository } from '@/repositories/core/system-skill-definitions-repository';

export interface SkillTreeNode {
  skill: SystemSkillDefinition;
  pricing: SkillPricing | null;
  children: SkillTreeNode[];
}

interface GetSkillTreeUseCaseRequest {
  module?: string;
}

interface GetSkillTreeUseCaseResponse {
  tree: SkillTreeNode[];
}

export class GetSkillTreeUseCase {
  constructor(
    private skillDefinitionsRepository: SystemSkillDefinitionsRepository,
    private skillPricingRepository: SkillPricingRepository,
  ) {}

  async execute({
    module,
  }: GetSkillTreeUseCaseRequest): Promise<GetSkillTreeUseCaseResponse> {
    const allSkillDefinitions = module
      ? await this.skillDefinitionsRepository.findByModule(module)
      : await this.skillDefinitionsRepository.findAll();

    const allPricingEntries = await this.skillPricingRepository.findAll();

    const pricingBySkillCode = new Map<string, SkillPricing>();

    for (const pricing of allPricingEntries) {
      pricingBySkillCode.set(pricing.skillCode, pricing);
    }

    const skillsByCode = new Map<string, SystemSkillDefinition>();

    for (const skill of allSkillDefinitions) {
      skillsByCode.set(skill.code, skill);
    }

    const childrenByParentCode = new Map<string, SystemSkillDefinition[]>();

    for (const skill of allSkillDefinitions) {
      const parentCode = skill.parentSkillCode;

      if (parentCode) {
        const siblings = childrenByParentCode.get(parentCode) ?? [];
        siblings.push(skill);
        childrenByParentCode.set(parentCode, siblings);
      }
    }

    const rootSkills = allSkillDefinitions.filter(
      (skill) => skill.parentSkillCode === null,
    );

    const tree = rootSkills.map((rootSkill) =>
      this.buildNode(rootSkill, pricingBySkillCode, childrenByParentCode),
    );

    return { tree };
  }

  private buildNode(
    skill: SystemSkillDefinition,
    pricingBySkillCode: Map<string, SkillPricing>,
    childrenByParentCode: Map<string, SystemSkillDefinition[]>,
  ): SkillTreeNode {
    const children = childrenByParentCode.get(skill.code) ?? [];

    return {
      skill,
      pricing: pricingBySkillCode.get(skill.code) ?? null,
      children: children.map((childSkill) =>
        this.buildNode(childSkill, pricingBySkillCode, childrenByParentCode),
      ),
    };
  }
}
