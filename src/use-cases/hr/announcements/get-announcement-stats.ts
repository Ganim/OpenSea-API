import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { AnnouncementReadReceiptsRepository } from '@/repositories/hr/announcement-read-receipts-repository';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';
import type { ResolveAudienceUseCase } from './resolve-audience';

const RECENT_READERS_LIMIT = 5;

export interface GetAnnouncementStatsInput {
  tenantId: string;
  announcementId: string;
}

export interface RecentReaderEntry {
  employee: Employee;
  readAt: Date;
}

export interface GetAnnouncementStatsOutput {
  totalAudience: number;
  readCount: number;
  unreadCount: number;
  /** 0–100 — `0` when the audience is empty (avoids division by zero). */
  readPercentage: number;
  recentReaders: RecentReaderEntry[];
}

/**
 * Aggregates read-receipt metrics for a single {@link CompanyAnnouncement}.
 * The percentage is rounded to one decimal place; the recent readers list is
 * capped at {@link RECENT_READERS_LIMIT} and sorted by `readAt` descending.
 */
export class GetAnnouncementStatsUseCase {
  constructor(
    private readonly announcementsRepository: CompanyAnnouncementsRepository,
    private readonly receiptsRepository: AnnouncementReadReceiptsRepository,
    private readonly resolveAudienceUseCase: ResolveAudienceUseCase,
  ) {}

  async execute(
    input: GetAnnouncementStatsInput,
  ): Promise<GetAnnouncementStatsOutput> {
    const { tenantId, announcementId } = input;

    const announcement = await this.announcementsRepository.findById(
      new UniqueEntityID(announcementId),
      tenantId,
    );

    if (!announcement) {
      throw new ResourceNotFoundError('Announcement not found');
    }

    const [{ employees: audienceEmployees }, persistedReceipts] =
      await Promise.all([
        this.resolveAudienceUseCase.execute({
          tenantId,
          announcement,
        }),
        this.receiptsRepository.findManyByAnnouncement(
          announcement.id,
          tenantId,
        ),
      ]);

    const audienceEmployeeIds = new Set(
      audienceEmployees.map((employee) => employee.id.toString()),
    );

    const receiptsWithinAudience = persistedReceipts.filter((receipt) =>
      audienceEmployeeIds.has(receipt.employeeId.toString()),
    );

    const employeesById = new Map<string, Employee>();
    for (const employee of audienceEmployees) {
      employeesById.set(employee.id.toString(), employee);
    }

    const recentReaders: RecentReaderEntry[] = receiptsWithinAudience
      .map((receipt) => {
        const employee = employeesById.get(receipt.employeeId.toString());
        if (!employee) return null;
        return { employee, readAt: receipt.readAt };
      })
      .filter((entry): entry is RecentReaderEntry => entry !== null)
      .sort((left, right) => right.readAt.getTime() - left.readAt.getTime())
      .slice(0, RECENT_READERS_LIMIT);

    const totalAudience = audienceEmployees.length;
    const readCount = receiptsWithinAudience.length;
    const unreadCount = Math.max(0, totalAudience - readCount);
    const readPercentage =
      totalAudience === 0
        ? 0
        : Math.round((readCount / totalAudience) * 1000) / 10;

    return {
      totalAudience,
      readCount,
      unreadCount,
      readPercentage,
      recentReaders,
    };
  }
}
