import type { PrismaClient } from '../generated/prisma/client.js';

const SLA_DEFAULTS = [
  {
    priority: 'CRITICAL' as const,
    firstResponseMinutes: 60,
    resolutionMinutes: 240,
  },
  {
    priority: 'HIGH' as const,
    firstResponseMinutes: 240,
    resolutionMinutes: 1440,
  },
  {
    priority: 'MEDIUM' as const,
    firstResponseMinutes: 1440,
    resolutionMinutes: 4320,
  },
  {
    priority: 'LOW' as const,
    firstResponseMinutes: 2880,
    resolutionMinutes: 14400,
  },
];

export async function seedSupportSlaConfig(prisma: PrismaClient) {
  console.log('\n⏱️  Sincronizando configurações de SLA...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const sla of SLA_DEFAULTS) {
    const existing = await prisma.supportSlaConfig.findUnique({
      where: { priority: sla.priority },
    });

    if (existing) {
      await prisma.supportSlaConfig.update({
        where: { priority: sla.priority },
        data: {
          firstResponseMinutes: sla.firstResponseMinutes,
          resolutionMinutes: sla.resolutionMinutes,
        },
      });
      updatedCount++;
    } else {
      await prisma.supportSlaConfig.create({
        data: {
          priority: sla.priority,
          firstResponseMinutes: sla.firstResponseMinutes,
          resolutionMinutes: sla.resolutionMinutes,
        },
      });
      createdCount++;
    }
  }

  console.log(
    `   ✅ ${createdCount} criados, ${updatedCount} atualizados (${SLA_DEFAULTS.length} total)`,
  );
}
