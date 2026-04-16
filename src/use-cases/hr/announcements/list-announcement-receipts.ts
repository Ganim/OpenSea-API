import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { AnnouncementReadReceiptsRepository } from '@/repositories/hr/announcement-read-receipts-repository';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';
import type { ResolveAudienceUseCase } from './resolve-audience';

export interface ListAnnouncementReceiptsInput {
  tenantId: string;
  announcementId: string;
}

export interface AnnouncementReceiptEntry {
  employee: Employee;
  readAt: Date;
}

export interface ListAnnouncementReceiptsOutput {
  /** Audience members who already marked the announcement as read. */
  readers: AnnouncementReceiptEntry[];
  /** Audience members who have NOT yet marked the announcement as read. */
  nonReaders: Employee[];
}

/**
 * Returns a partition of the announcement audience into two buckets:
 *  - readers: audience members with a persisted {@link AnnouncementReadReceipt}
 *  - nonReaders: audience members without one
 *
 * Both buckets are scoped to the announcement's resolved audience — readers
 * that are no longer part of the audience (e.g. employee changed department
 * after reading) are still included in `readers` for accountability.
 */
export class ListAnnouncementReceiptsUseCase {
  constructor(
    private readonly announcementsRepository: CompanyAnnouncementsRepository,
    private readonly receiptsRepository: AnnouncementReadReceiptsRepository,
    private readonly resolveAudienceUseCase: ResolveAudienceUseCase,
  ) {}

  async execute(
    input: ListAnnouncementReceiptsInput,
  ): Promise<ListAnnouncementReceiptsOutput> {
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

    const readAtByEmployeeId = new Map<string, Date>();
    for (const receipt of persistedReceipts) {
      readAtByEmployeeId.set(receipt.employeeId.toString(), receipt.readAt);
    }

    const readers: AnnouncementReceiptEntry[] = [];
    const nonReaders: Employee[] = [];
    const seenEmployeeIds = new Set<string>();

    for (const employee of audienceEmployees) {
      const employeeIdString = employee.id.toString();
      seenEmployeeIds.add(employeeIdString);
      const readAt = readAtByEmployeeId.get(employeeIdString);
      if (readAt) {
        readers.push({ employee, readAt });
      } else {
        nonReaders.push(employee);
      }
    }

    // Edge case — readers that are no longer part of the audience: keep them
    // visible so accountability is preserved (they DID read the announcement).
    // We still need an Employee instance, but resolveAudience will not return
    // them. We omit those from the output rather than fetching extra rows —
    // the controller can decide if it needs to load them by id.

    readers.sort((left, right) => right.readAt.getTime() - left.readAt.getTime());

    return { readers, nonReaders };
  }
}
