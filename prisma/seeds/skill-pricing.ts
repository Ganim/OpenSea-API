import type { PrismaClient } from '../generated/prisma/client.js';

interface SkillPricingInput {
  skillCode: string;
  pricingType: 'FLAT' | 'PER_UNIT' | 'USAGE';
  flatPrice?: number;
  unitPrice?: number;
  unitMetric?: string;
  unitMetricLabel?: string;
  usageIncluded?: number;
  usagePrice?: number;
  usageMetric?: string;
  usageMetricLabel?: string;
}

const SKILL_PRICING_DEFAULTS: SkillPricingInput[] = [
  // STOCK
  { skillCode: 'stock.warehouses', pricingType: 'FLAT', flatPrice: 25 },
  { skillCode: 'stock.labels', pricingType: 'FLAT', flatPrice: 10 },

  // HR
  { skillCode: 'hr.payroll', pricingType: 'FLAT', flatPrice: 30 },
  {
    skillCode: 'hr.attendance',
    pricingType: 'PER_UNIT',
    unitPrice: 3,
    unitMetric: 'employees',
    unitMetricLabel: 'funcionário',
  },
  { skillCode: 'hr.absences', pricingType: 'FLAT', flatPrice: 15 },
  { skillCode: 'hr.schedules', pricingType: 'FLAT', flatPrice: 20 },

  // SALES
  { skillCode: 'sales.inbox', pricingType: 'FLAT', flatPrice: 30 },
  { skillCode: 'sales.inbox.whatsapp', pricingType: 'FLAT', flatPrice: 20 },
  { skillCode: 'sales.inbox.instagram', pricingType: 'FLAT', flatPrice: 15 },
  { skillCode: 'sales.pos', pricingType: 'FLAT', flatPrice: 40 },
  { skillCode: 'sales.pos.offline', pricingType: 'FLAT', flatPrice: 15 },
  { skillCode: 'sales.pos.tef', pricingType: 'FLAT', flatPrice: 25 },
  { skillCode: 'sales.marketplaces', pricingType: 'FLAT', flatPrice: 50 },

  // TOOLS
  { skillCode: 'tools.email', pricingType: 'FLAT', flatPrice: 19 },
  {
    skillCode: 'tools.storage',
    pricingType: 'USAGE',
    usageIncluded: 1024,
    usagePrice: 2,
    usageMetric: 'storage_mb',
    usageMetricLabel: 'MB',
  },

  // AI (usage-based)
  {
    skillCode: 'tools.ai',
    pricingType: 'USAGE',
    usageIncluded: 500,
    usagePrice: 0.02,
    usageMetric: 'ai_queries',
    usageMetricLabel: 'query',
  },
];

export async function seedSkillPricing(prisma: PrismaClient) {
  console.log('\n💰 Sincronizando preços de skills...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const pricing of SKILL_PRICING_DEFAULTS) {
    const pricingData = {
      pricingType: pricing.pricingType,
      flatPrice: pricing.flatPrice ?? null,
      unitPrice: pricing.unitPrice ?? null,
      unitMetric: pricing.unitMetric ?? null,
      unitMetricLabel: pricing.unitMetricLabel ?? null,
      usageIncluded: pricing.usageIncluded ?? null,
      usagePrice: pricing.usagePrice ?? null,
      usageMetric: pricing.usageMetric ?? null,
      usageMetricLabel: pricing.usageMetricLabel ?? null,
    };

    const existing = await prisma.skillPricing.findUnique({
      where: { skillCode: pricing.skillCode },
    });

    if (existing) {
      await prisma.skillPricing.update({
        where: { skillCode: pricing.skillCode },
        data: pricingData,
      });
      updatedCount++;
    } else {
      await prisma.skillPricing.create({
        data: {
          skillCode: pricing.skillCode,
          ...pricingData,
        },
      });
      createdCount++;
    }
  }

  console.log(
    `   ✅ ${createdCount} preços criados, ${updatedCount} atualizados (${SKILL_PRICING_DEFAULTS.length} total)`,
  );
}
