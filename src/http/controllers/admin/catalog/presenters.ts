import type { SkillPricing } from '@/entities/core/skill-pricing';
import type { SystemSkillDefinition } from '@/entities/core/system-skill-definition';

export function presentSkillDefinition(skill: SystemSkillDefinition) {
  return {
    id: skill.id.toString(),
    code: skill.code,
    name: skill.name,
    description: skill.description,
    module: skill.module,
    parentSkillCode: skill.parentSkillCode,
    category: skill.category,
    isCore: skill.isCore,
    isVisible: skill.isVisible,
    iconUrl: skill.iconUrl,
    requiresSetup: skill.requiresSetup,
    setupUrl: skill.setupUrl,
    sortOrder: skill.sortOrder,
    metadata: skill.metadata,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  };
}

export function presentSkillPricing(pricing: SkillPricing) {
  return {
    id: pricing.id.toString(),
    skillCode: pricing.skillCode,
    pricingType: pricing.pricingType,
    flatPrice: pricing.flatPrice,
    unitPrice: pricing.unitPrice,
    unitMetric: pricing.unitMetric,
    unitMetricLabel: pricing.unitMetricLabel,
    freeQuota: pricing.freeQuota,
    usageIncluded: pricing.usageIncluded,
    usagePrice: pricing.usagePrice,
    usageMetric: pricing.usageMetric,
    usageMetricLabel: pricing.usageMetricLabel,
    annualDiscount: pricing.annualDiscount,
    isActive: pricing.isActive,
    tiers: pricing.tiers,
    createdAt: pricing.createdAt,
    updatedAt: pricing.updatedAt,
  };
}
