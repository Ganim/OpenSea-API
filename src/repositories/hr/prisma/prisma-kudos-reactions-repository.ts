import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReaction } from '@/entities/hr/kudos-reaction';
import { prisma } from '@/lib/prisma';
import { mapKudosReactionPrismaToDomain } from '@/mappers/hr/kudos-reaction';
import type {
  KudosReactionSummaryItem,
  KudosReactionsRepository,
} from '../kudos-reactions-repository';

const MAX_EMPLOYEES_PER_EMOJI_PREVIEW = 5;

export class PrismaKudosReactionsRepository
  implements KudosReactionsRepository
{
  async create(reaction: KudosReaction): Promise<void> {
    await prisma.kudosReaction.create({
      data: {
        id: reaction.id.toString(),
        tenantId: reaction.tenantId.toString(),
        kudosId: reaction.kudosId.toString(),
        employeeId: reaction.employeeId.toString(),
        emoji: reaction.emoji,
      },
    });
  }

  async delete(reactionId: UniqueEntityID): Promise<void> {
    await prisma.kudosReaction.delete({
      where: { id: reactionId.toString() },
    });
  }

  async findByKudosEmployeeEmoji(
    kudosId: UniqueEntityID,
    employeeId: UniqueEntityID,
    emoji: string,
  ): Promise<KudosReaction | null> {
    const raw = await prisma.kudosReaction.findUnique({
      where: {
        kudosId_employeeId_emoji: {
          kudosId: kudosId.toString(),
          employeeId: employeeId.toString(),
          emoji,
        },
      },
    });

    if (!raw) return null;
    return mapKudosReactionPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
  }

  async findManyByKudosId(kudosId: UniqueEntityID): Promise<KudosReaction[]> {
    const rawItems = await prisma.kudosReaction.findMany({
      where: { kudosId: kudosId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return rawItems.map((raw) =>
      mapKudosReactionPrismaToDomain(raw as unknown as Record<string, unknown>),
    );
  }

  async summarizeForKudosIds(
    kudosIds: string[],
  ): Promise<Record<string, KudosReactionSummaryItem[]>> {
    if (kudosIds.length === 0) return {};

    const rawItems = await prisma.kudosReaction.findMany({
      where: { kudosId: { in: kudosIds } },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, Map<string, string[]>>();

    for (const reaction of rawItems) {
      const byKudos = grouped.get(reaction.kudosId) ?? new Map();
      const employees = byKudos.get(reaction.emoji) ?? [];
      employees.push(reaction.employeeId);
      byKudos.set(reaction.emoji, employees);
      grouped.set(reaction.kudosId, byKudos);
    }

    const summary: Record<string, KudosReactionSummaryItem[]> = {};
    for (const kudosId of kudosIds) {
      const byKudos = grouped.get(kudosId);
      if (!byKudos) {
        summary[kudosId] = [];
        continue;
      }

      summary[kudosId] = Array.from(byKudos.entries())
        .map(([emoji, employeeIds]) => ({
          emoji,
          count: employeeIds.length,
          employeeIds: employeeIds.slice(0, MAX_EMPLOYEES_PER_EMOJI_PREVIEW),
        }))
        .sort((a, b) => b.count - a.count);
    }

    return summary;
  }
}
