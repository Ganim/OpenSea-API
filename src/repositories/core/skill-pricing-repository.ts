import type { SkillPricing } from '@/entities/core/skill-pricing';

export interface SkillPricingRepository {
  findBySkillCode(skillCode: string): Promise<SkillPricing | null>;
  findAll(): Promise<SkillPricing[]>;
  findByPricingType(type: string): Promise<SkillPricing[]>;
  upsert(entity: SkillPricing): Promise<void>;
  delete(skillCode: string): Promise<void>;
}
