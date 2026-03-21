import { PrismaSkillPricingRepository } from '@/repositories/core/prisma/prisma-skill-pricing-repository';
import { PrismaSystemSkillDefinitionsRepository } from '@/repositories/core/prisma/prisma-system-skill-definitions-repository';
import { ListSkillDefinitionsUseCase } from '../list-skill-definitions';

export function makeListSkillDefinitionsUseCase() {
  const skillDefinitionsRepository =
    new PrismaSystemSkillDefinitionsRepository();
  const skillPricingRepository = new PrismaSkillPricingRepository();

  return new ListSkillDefinitionsUseCase(
    skillDefinitionsRepository,
    skillPricingRepository,
  );
}
