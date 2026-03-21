import { PrismaSkillPricingRepository } from '@/repositories/core/prisma/prisma-skill-pricing-repository';
import { PrismaSystemSkillDefinitionsRepository } from '@/repositories/core/prisma/prisma-system-skill-definitions-repository';
import { GetSkillTreeUseCase } from '../get-skill-tree';

export function makeGetSkillTreeUseCase() {
  const skillDefinitionsRepository =
    new PrismaSystemSkillDefinitionsRepository();
  const skillPricingRepository = new PrismaSkillPricingRepository();

  return new GetSkillTreeUseCase(
    skillDefinitionsRepository,
    skillPricingRepository,
  );
}
