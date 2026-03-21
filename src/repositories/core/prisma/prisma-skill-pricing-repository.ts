import {
  skillPricingPrismaToDomain,
  skillPricingToPrisma,
} from '@/mappers/core/skill-pricing-mapper';
import { prisma } from '@/lib/prisma';
import type { SkillPricing } from '@/entities/core/skill-pricing';
import type { Prisma } from '@prisma/generated/client';
import type { SkillPricingRepository } from '../skill-pricing-repository';

export class PrismaSkillPricingRepository implements SkillPricingRepository {
  async findBySkillCode(skillCode: string): Promise<SkillPricing | null> {
    const pricingDb = await prisma.skillPricing.findUnique({
      where: { skillCode },
    });
    if (!pricingDb) return null;

    return skillPricingPrismaToDomain(pricingDb);
  }

  async findAll(): Promise<SkillPricing[]> {
    const pricingsDb = await prisma.skillPricing.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return pricingsDb.map(skillPricingPrismaToDomain);
  }

  async findByPricingType(type: string): Promise<SkillPricing[]> {
    const pricingsDb = await prisma.skillPricing.findMany({
      where: { pricingType: type as never },
      orderBy: { createdAt: 'desc' },
    });

    return pricingsDb.map(skillPricingPrismaToDomain);
  }

  async upsert(entity: SkillPricing): Promise<void> {
    const prismaData = skillPricingToPrisma(entity);

    await prisma.skillPricing.upsert({
      where: { skillCode: prismaData.skillCode },
      create: prismaData as Prisma.SkillPricingUncheckedCreateInput,
      update: prismaData as Prisma.SkillPricingUncheckedUpdateInput,
    });
  }

  async delete(skillCode: string): Promise<void> {
    await prisma.skillPricing.delete({
      where: { skillCode },
    });
  }
}
