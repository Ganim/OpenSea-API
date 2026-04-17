import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import { prisma } from '@/lib/prisma';
import { mapCompanyAnnouncementPrismaToDomain } from '@/mappers/hr/company-announcement';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CompanyAnnouncementsRepository,
  FindManyActiveFilters,
  PaginatedAnnouncementsResult,
} from '../company-announcements-repository';

export class PrismaCompanyAnnouncementsRepository
  implements CompanyAnnouncementsRepository
{
  async create(announcement: CompanyAnnouncement): Promise<void> {
    await prisma.companyAnnouncement.create({
      data: {
        id: announcement.id.toString(),
        tenantId: announcement.tenantId.toString(),
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        publishedAt: announcement.publishedAt,
        expiresAt: announcement.expiresAt,
        authorEmployeeId: announcement.authorEmployeeId?.toString(),
        targetDepartmentIds:
          (announcement.audiencePayload as Prisma.InputJsonValue | undefined) ??
          undefined,
        isActive: announcement.isActive,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CompanyAnnouncement | null> {
    const raw = await prisma.companyAnnouncement.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!raw) return null;

    const domainProps = mapCompanyAnnouncementPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return CompanyAnnouncement.create(domainProps, new UniqueEntityID(raw.id));
  }

  async findManyActive(
    tenantId: string,
    skip: number,
    take: number,
    filters: FindManyActiveFilters = {},
  ): Promise<PaginatedAnnouncementsResult> {
    const where: Record<string, unknown> = {
      tenantId,
      isActive: true,
    };

    if (filters.unreadOnly && filters.currentEmployeeId) {
      where.readReceipts = {
        none: {
          employeeId: filters.currentEmployeeId.toString(),
        },
      };
    }

    const [rawItems, total] = await Promise.all([
      prisma.companyAnnouncement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyAnnouncement.count({ where }),
    ]);

    const announcements = rawItems.map((raw) => {
      const domainProps = mapCompanyAnnouncementPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return CompanyAnnouncement.create(
        domainProps,
        new UniqueEntityID(raw.id),
      );
    });

    return { announcements, total };
  }

  async save(announcement: CompanyAnnouncement): Promise<void> {
    await prisma.companyAnnouncement.update({
      where: {
        id: announcement.id.toString(),
        tenantId: announcement.tenantId.toString(),
      },
      data: {
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        publishedAt: announcement.publishedAt,
        expiresAt: announcement.expiresAt,
        targetDepartmentIds:
          (announcement.audiencePayload as Prisma.InputJsonValue | undefined) ??
          undefined,
        isActive: announcement.isActive,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.companyAnnouncement.delete({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
    });
  }
}
