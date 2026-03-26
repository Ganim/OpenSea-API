import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { LeadScoringRule } from '@/entities/sales/lead-scoring-rule';
import { prisma } from '@/lib/prisma';
import type {
  CreateLeadScoringRuleSchema,
  LeadScoringRulesRepository,
} from '../lead-scoring-rules-repository';

function mapToDomain(data: Record<string, unknown>): LeadScoringRule {
  return LeadScoringRule.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      field: data.field as string,
      condition: data.condition as string,
      value: data.value as string,
      points: data.points as number,
      isActive: data.isActive as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaLeadScoringRulesRepository
  implements LeadScoringRulesRepository
{
  async create(data: CreateLeadScoringRuleSchema): Promise<LeadScoringRule> {
    const scoringRuleData = await prisma.leadScoringRule.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        field: data.field,
        condition: data.condition,
        value: data.value,
        points: data.points,
        isActive: data.isActive ?? true,
      },
    });

    return mapToDomain(scoringRuleData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadScoringRule | null> {
    const scoringRuleData = await prisma.leadScoringRule.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!scoringRuleData) return null;
    return mapToDomain(scoringRuleData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<LeadScoringRule[]> {
    const scoringRulesData = await prisma.leadScoringRule.findMany({
      where: { tenantId, deletedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return scoringRulesData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async findActiveByTenant(tenantId: string): Promise<LeadScoringRule[]> {
    const scoringRulesData = await prisma.leadScoringRule.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return scoringRulesData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.leadScoringRule.count({
      where: { tenantId, deletedAt: null },
    });
  }

  async save(scoringRule: LeadScoringRule): Promise<void> {
    await prisma.leadScoringRule.update({
      where: { id: scoringRule.id.toString() },
      data: {
        name: scoringRule.name,
        field: scoringRule.field,
        condition: scoringRule.condition,
        value: scoringRule.value,
        points: scoringRule.points,
        isActive: scoringRule.isActive,
        deletedAt: scoringRule.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.leadScoringRule.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
