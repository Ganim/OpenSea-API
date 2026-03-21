import { PrismaSkillPricingRepository } from '@/repositories/core/prisma/prisma-skill-pricing-repository';
import { ListSkillPricingUseCase } from '../list-skill-pricing';

export function makeListSkillPricingUseCase() {
  const skillPricingRepository = new PrismaSkillPricingRepository();

  return new ListSkillPricingUseCase(skillPricingRepository);
}
