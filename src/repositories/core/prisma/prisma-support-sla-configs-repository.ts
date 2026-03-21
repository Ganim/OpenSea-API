import type { SupportSlaConfig } from '@/entities/core/support-sla-config';
import { prisma } from '@/lib/prisma';
import {
  supportSlaConfigPrismaToDomain,
  supportSlaConfigToPrisma,
} from '@/mappers/core/support-sla-config-mapper';
import type { Prisma } from '@prisma/generated/client';
import type { SupportSlaConfigsRepository } from '../support-sla-configs-repository';

export class PrismaSupportSlaConfigsRepository
  implements SupportSlaConfigsRepository
{
  async findByPriority(priority: string): Promise<SupportSlaConfig | null> {
    const slaConfigDb = await prisma.supportSlaConfig.findUnique({
      where: { priority: priority as never },
    });
    if (!slaConfigDb) return null;
    return supportSlaConfigPrismaToDomain(slaConfigDb);
  }

  async findAll(): Promise<SupportSlaConfig[]> {
    const slaConfigsDb = await prisma.supportSlaConfig.findMany({
      orderBy: { priority: 'asc' },
    });

    return slaConfigsDb.map(supportSlaConfigPrismaToDomain);
  }

  async save(slaConfig: SupportSlaConfig): Promise<void> {
    const prismaData = supportSlaConfigToPrisma(slaConfig);

    await prisma.supportSlaConfig.upsert({
      where: { id: prismaData.id },
      create: prismaData as Prisma.SupportSlaConfigUncheckedCreateInput,
      update: prismaData as Prisma.SupportSlaConfigUncheckedUpdateInput,
    });
  }
}
