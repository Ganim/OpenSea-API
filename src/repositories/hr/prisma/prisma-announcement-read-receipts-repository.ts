import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnnouncementReadReceipt } from '@/entities/hr/announcement-read-receipt';
import { prisma } from '@/lib/prisma';
import type { AnnouncementReadReceiptsRepository } from '../announcement-read-receipts-repository';

export class PrismaAnnouncementReadReceiptsRepository
  implements AnnouncementReadReceiptsRepository
{
  async markAsRead(params: {
    tenantId: UniqueEntityID;
    announcementId: UniqueEntityID;
    employeeId: UniqueEntityID;
    readAt?: Date;
  }): Promise<AnnouncementReadReceipt> {
    const announcementId = params.announcementId.toString();
    const employeeId = params.employeeId.toString();
    const tenantId = params.tenantId.toString();
    const readAt = params.readAt ?? new Date();

    const persisted = await prisma.announcementReadReceipt.upsert({
      where: {
        announcementId_employeeId: {
          announcementId,
          employeeId,
        },
      },
      create: {
        tenantId,
        announcementId,
        employeeId,
        readAt,
      },
      update: {},
    });

    return AnnouncementReadReceipt.create(
      {
        tenantId: new UniqueEntityID(persisted.tenantId),
        announcementId: new UniqueEntityID(persisted.announcementId),
        employeeId: new UniqueEntityID(persisted.employeeId),
        readAt: persisted.readAt,
      },
      new UniqueEntityID(persisted.id),
    );
  }

  async findByAnnouncementAndEmployee(
    announcementId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<AnnouncementReadReceipt | null> {
    const persisted = await prisma.announcementReadReceipt.findFirst({
      where: {
        announcementId: announcementId.toString(),
        employeeId: employeeId.toString(),
        tenantId,
      },
    });

    if (!persisted) return null;

    return AnnouncementReadReceipt.create(
      {
        tenantId: new UniqueEntityID(persisted.tenantId),
        announcementId: new UniqueEntityID(persisted.announcementId),
        employeeId: new UniqueEntityID(persisted.employeeId),
        readAt: persisted.readAt,
      },
      new UniqueEntityID(persisted.id),
    );
  }

  async findManyByAnnouncement(
    announcementId: UniqueEntityID,
    tenantId: string,
  ): Promise<AnnouncementReadReceipt[]> {
    const rawReceipts = await prisma.announcementReadReceipt.findMany({
      where: {
        announcementId: announcementId.toString(),
        tenantId,
      },
      orderBy: { readAt: 'desc' },
    });

    return rawReceipts.map((raw) =>
      AnnouncementReadReceipt.create(
        {
          tenantId: new UniqueEntityID(raw.tenantId),
          announcementId: new UniqueEntityID(raw.announcementId),
          employeeId: new UniqueEntityID(raw.employeeId),
          readAt: raw.readAt,
        },
        new UniqueEntityID(raw.id),
      ),
    );
  }

  async countByAnnouncement(
    announcementId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    return prisma.announcementReadReceipt.count({
      where: {
        announcementId: announcementId.toString(),
        tenantId,
      },
    });
  }

  async findReadAnnouncementIdsByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    announcementIds: string[],
  ): Promise<Set<string>> {
    if (announcementIds.length === 0) return new Set<string>();

    const rawReceipts = await prisma.announcementReadReceipt.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        announcementId: { in: announcementIds },
      },
      select: { announcementId: true },
    });

    return new Set(rawReceipts.map((raw) => raw.announcementId));
  }

  async countByAnnouncementIds(
    announcementIds: string[],
    tenantId: string,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    for (const announcementId of announcementIds) {
      counts.set(announcementId, 0);
    }

    if (announcementIds.length === 0) return counts;

    const grouped = await prisma.announcementReadReceipt.groupBy({
      by: ['announcementId'],
      where: {
        tenantId,
        announcementId: { in: announcementIds },
      },
      _count: { _all: true },
    });

    for (const group of grouped) {
      counts.set(group.announcementId, group._count._all);
    }

    return counts;
  }
}
