import { PrismaSkillPricingRepository } from '@/repositories/core/prisma/prisma-skill-pricing-repository';
import { PrismaSystemSkillDefinitionsRepository } from '@/repositories/core/prisma/prisma-system-skill-definitions-repository';
import { UpsertSkillPricingUseCase } from '../upsert-skill-pricing';

export function makeUpsertSkillPricingUseCase() {
  const skillDefinitionsRepository =
    new PrismaSystemSkillDefinitionsRepository();
  const skillPricingRepository = new PrismaSkillPricingRepository();

  return new UpsertSkillPricingUseCase(
    skillDefinitionsRepository,
    skillPricingRepository,
  );
}
