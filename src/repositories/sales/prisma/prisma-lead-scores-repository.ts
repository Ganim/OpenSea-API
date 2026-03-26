import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { LeadScore } from '@/entities/sales/lead-score';
import type { LeadScoreFactor } from '@/entities/sales/lead-score';
import { prisma } from '@/lib/prisma';
import type {
  CreateLeadScoreSchema,
  LeadScoresRepository,
} from '../lead-scores-repository';

function mapToDomain(data: Record<string, unknown>): LeadScore {
  return LeadScore.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      customerId: data.customerId as string,
      score: data.score as number,
      tier: data.tier as string,
      factors: (data.factors as LeadScoreFactor[]) ?? [],
      calculatedAt: data.calculatedAt as Date,
      createdAt: data.createdAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaLeadScoresRepository implements LeadScoresRepository {
  async upsert(data: CreateLeadScoreSchema): Promise<LeadScore> {
    const leadScoreData = await prisma.leadScore.upsert({
      where: {
        tenantId_customerId: {
          tenantId: data.tenantId,
          customerId: data.customerId,
        },
      },
      update: {
        score: data.score,
        tier: data.tier,
        factors: data.factors as object,
        calculatedAt: data.calculatedAt,
      },
      create: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        score: data.score,
        tier: data.tier,
        factors: data.factors as object,
        calculatedAt: data.calculatedAt,
      },
    });

    return mapToDomain(leadScoreData as unknown as Record<string, unknown>);
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<LeadScore | null> {
    const leadScoreData = await prisma.leadScore.findUnique({
      where: {
        tenantId_customerId: { tenantId, customerId },
      },
    });

    if (!leadScoreData) return null;
    return mapToDomain(leadScoreData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadScore | null> {
    const leadScoreData = await prisma.leadScore.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!leadScoreData) return null;
    return mapToDomain(leadScoreData as unknown as Record<string, unknown>);
  }

  async findManyByTenant(tenantId: string): Promise<LeadScore[]> {
    const leadScoresData = await prisma.leadScore.findMany({
      where: { tenantId },
      orderBy: { score: 'desc' },
    });

    return leadScoresData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async deleteByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<void> {
    await prisma.leadScore.deleteMany({
      where: { tenantId, customerId },
    });
  }
}
