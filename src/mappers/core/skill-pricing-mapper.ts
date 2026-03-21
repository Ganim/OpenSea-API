import { SkillPricing } from '@/entities/core/skill-pricing';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SkillPricing as PrismaSkillPricing } from '@prisma/generated/client';

export interface SkillPricingDTO {
  id: string;
  skillCode: string;
  pricingType: string;
  flatPrice: number | null;
  unitPrice: number | null;
  unitMetric: string | null;
  unitMetricLabel: string | null;
  freeQuota: number | null;
  usageMetric: string | null;
  usageIncluded: number | null;
  usagePrice: number | null;
  usageMetricLabel: string | null;
  annualDiscount: number | null;
  isActive: boolean;
  tiers: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export function skillPricingPrismaToDomain(
  raw: PrismaSkillPricing,
): SkillPricing {
  return SkillPricing.create(
    {
      id: new UniqueEntityID(raw.id),
      skillCode: raw.skillCode,
      pricingType: raw.pricingType,
      flatPrice: raw.flatPrice ? Number(raw.flatPrice) : null,
      unitPrice: raw.unitPrice ? Number(raw.unitPrice) : null,
      unitMetric: raw.unitMetric,
      unitMetricLabel: raw.unitMetricLabel,
      freeQuota: raw.freeQuota,
      usageMetric: raw.usageMetric,
      usageIncluded: raw.usageIncluded,
      usagePrice: raw.usagePrice ? Number(raw.usagePrice) : null,
      usageMetricLabel: raw.usageMetricLabel,
      annualDiscount: raw.annualDiscount ? Number(raw.annualDiscount) : null,
      isActive: raw.isActive,
      tiers: raw.tiers as unknown[],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function skillPricingToDTO(pricing: SkillPricing): SkillPricingDTO {
  return {
    id: pricing.skillPricingId.toString(),
    skillCode: pricing.skillCode,
    pricingType: pricing.pricingType,
    flatPrice: pricing.flatPrice,
    unitPrice: pricing.unitPrice,
    unitMetric: pricing.unitMetric,
    unitMetricLabel: pricing.unitMetricLabel,
    freeQuota: pricing.freeQuota,
    usageMetric: pricing.usageMetric,
    usageIncluded: pricing.usageIncluded,
    usagePrice: pricing.usagePrice,
    usageMetricLabel: pricing.usageMetricLabel,
    annualDiscount: pricing.annualDiscount,
    isActive: pricing.isActive,
    tiers: pricing.tiers,
    createdAt: pricing.createdAt,
    updatedAt: pricing.updatedAt ?? pricing.createdAt,
  };
}

export function skillPricingToPrisma(pricing: SkillPricing) {
  return {
    id: pricing.skillPricingId.toString(),
    skillCode: pricing.skillCode,
    pricingType: pricing.pricingType as PrismaSkillPricing['pricingType'],
    flatPrice: pricing.flatPrice,
    unitPrice: pricing.unitPrice,
    unitMetric: pricing.unitMetric,
    unitMetricLabel: pricing.unitMetricLabel,
    freeQuota: pricing.freeQuota,
    usageMetric: pricing.usageMetric,
    usageIncluded: pricing.usageIncluded,
    usagePrice: pricing.usagePrice,
    usageMetricLabel: pricing.usageMetricLabel,
    annualDiscount: pricing.annualDiscount,
    isActive: pricing.isActive,
    tiers: pricing.tiers,
  };
}
