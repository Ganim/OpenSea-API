import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReply } from '@/entities/hr/kudos-reply';
import { prisma } from '@/lib/prisma';
import { mapKudosReplyPrismaToDomain } from '@/mappers/hr/kudos-reply';
import type { KudosRepliesRepository } from '../kudos-replies-repository';

export class PrismaKudosRepliesRepository implements KudosRepliesRepository {
  async create(reply: KudosReply): Promise<void> {
    await prisma.kudosReply.create({
      data: {
        id: reply.id.toString(),
        tenantId: reply.tenantId.toString(),
        kudosId: reply.kudosId.toString(),
        employeeId: reply.employeeId.toString(),
        content: reply.content,
      },
    });
  }

  async save(reply: KudosReply): Promise<void> {
    await prisma.kudosReply.update({
      where: { id: reply.id.toString(), tenantId: reply.tenantId.toString() },
      data: {
        content: reply.content,
        deletedAt: reply.deletedAt ?? null,
      },
    });
  }

  async findById(replyId: UniqueEntityID): Promise<KudosReply | null> {
    const raw = await prisma.kudosReply.findUnique({
      where: { id: replyId.toString() },
    });

    if (!raw) return null;
    return mapKudosReplyPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
  }

  async findManyByKudosId(kudosId: UniqueEntityID): Promise<KudosReply[]> {
    const rawItems = await prisma.kudosReply.findMany({
      where: { kudosId: kudosId.toString(), deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    return rawItems.map((raw) =>
      mapKudosReplyPrismaToDomain(raw as unknown as Record<string, unknown>),
    );
  }

  async countActiveForKudosIds(
    kudosIds: string[],
  ): Promise<Record<string, number>> {
    if (kudosIds.length === 0) return {};

    const grouped = await prisma.kudosReply.groupBy({
      by: ['kudosId'],
      where: { kudosId: { in: kudosIds }, deletedAt: null },
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};
    for (const kudosId of kudosIds) counts[kudosId] = 0;
    for (const row of grouped) {
      counts[row.kudosId] = row._count._all;
    }

    return counts;
  }
}
