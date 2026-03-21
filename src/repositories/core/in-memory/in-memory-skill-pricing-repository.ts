import type { SkillPricing } from '@/entities/core/skill-pricing';
import type { SkillPricingRepository } from '../skill-pricing-repository';

export class InMemorySkillPricingRepository implements SkillPricingRepository {
  public items: SkillPricing[] = [];

  async findBySkillCode(skillCode: string): Promise<SkillPricing | null> {
    const pricing = this.items.find((item) => item.skillCode === skillCode);

    return pricing ?? null;
  }

  async findAll(): Promise<SkillPricing[]> {
    return [...this.items];
  }

  async findByPricingType(type: string): Promise<SkillPricing[]> {
    return this.items.filter((item) => item.pricingType === type);
  }

  async upsert(entity: SkillPricing): Promise<void> {
    const existingIndex = this.items.findIndex(
      (item) => item.skillCode === entity.skillCode,
    );

    if (existingIndex !== -1) {
      this.items[existingIndex] = entity;
    } else {
      this.items.push(entity);
    }
  }

  async delete(skillCode: string): Promise<void> {
    const index = this.items.findIndex((item) => item.skillCode === skillCode);

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
