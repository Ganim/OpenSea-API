import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import type { AnnouncementReadReceiptsRepository } from '@/repositories/hr/announcement-read-receipts-repository';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { ResolveAudienceUseCase } from './resolve-audience';

export interface ListAnnouncementsInput {
  tenantId: string;
  page: number;
  limit: number;
  /**
   * When `true` AND {@link currentUserId} resolves to an employee, only
   * announcements that the current employee has NOT read are returned.
   */
  unreadOnly?: boolean;
  currentUserId?: string;
}

export interface AnnouncementListItem {
  announcement: CompanyAnnouncement;
  isReadByMe: boolean;
  readCount: number;
  audienceCount: number;
}

export interface ListAnnouncementsOutput {
  announcements: CompanyAnnouncement[];
  items: AnnouncementListItem[];
  total: number;
}

/**
 * Lists active announcements with optional read-status enrichment.
 *
 * The `currentUserId` is resolved to the matching {@link Employee}; when no
 * matching employee exists the read-status fields default to `false`/`0`
 * but the listing itself is still returned (i.e. users without an employee
 * record can still see announcements).
 */
export class ListAnnouncementsUseCase {
  constructor(
    private companyAnnouncementsRepository: CompanyAnnouncementsRepository,
    private receiptsRepository?: AnnouncementReadReceiptsRepository,
    private employeesRepository?: EmployeesRepository,
    private resolveAudienceUseCase?: ResolveAudienceUseCase,
  ) {}

  async execute(
    input: ListAnnouncementsInput,
  ): Promise<ListAnnouncementsOutput> {
    const { tenantId, page, limit, unreadOnly, currentUserId } = input;
    const skip = (page - 1) * limit;

    const currentEmployeeId = await this.resolveCurrentEmployeeId(
      currentUserId,
      tenantId,
    );

    const { announcements, total } =
      await this.companyAnnouncementsRepository.findManyActive(
        tenantId,
        skip,
        limit,
        {
          unreadOnly: Boolean(unreadOnly && currentEmployeeId),
          currentEmployeeId,
        },
      );

    const items = await this.enrichAnnouncements(
      announcements,
      tenantId,
      currentEmployeeId,
    );

    return { announcements, items, total };
  }

  private async resolveCurrentEmployeeId(
    currentUserId: string | undefined,
    tenantId: string,
  ): Promise<UniqueEntityID | undefined> {
    if (!currentUserId || !this.employeesRepository) return undefined;
    const employee = await this.employeesRepository.findByUserId(
      new UniqueEntityID(currentUserId),
      tenantId,
    );
    return employee?.id;
  }

  private async enrichAnnouncements(
    announcements: CompanyAnnouncement[],
    tenantId: string,
    currentEmployeeId: UniqueEntityID | undefined,
  ): Promise<AnnouncementListItem[]> {
    if (announcements.length === 0) return [];

    const announcementIds = announcements.map((announcement) =>
      announcement.id.toString(),
    );

    const [readCountByAnnouncementId, readByCurrentEmployeeIds] =
      await Promise.all([
        this.receiptsRepository
          ? this.receiptsRepository.countByAnnouncementIds(
              announcementIds,
              tenantId,
            )
          : Promise.resolve(new Map<string, number>()),
        this.receiptsRepository && currentEmployeeId
          ? this.receiptsRepository.findReadAnnouncementIdsByEmployee(
              currentEmployeeId,
              tenantId,
              announcementIds,
            )
          : Promise.resolve(new Set<string>()),
      ]);

    const items: AnnouncementListItem[] = [];
    for (const announcement of announcements) {
      const announcementIdString = announcement.id.toString();
      const audienceCount = await this.resolveAudienceCount(
        announcement,
        tenantId,
      );
      items.push({
        announcement,
        isReadByMe: readByCurrentEmployeeIds.has(announcementIdString),
        readCount: readCountByAnnouncementId.get(announcementIdString) ?? 0,
        audienceCount,
      });
    }

    return items;
  }

  private async resolveAudienceCount(
    announcement: CompanyAnnouncement,
    tenantId: string,
  ): Promise<number> {
    if (!this.resolveAudienceUseCase) return 0;
    const { employees } = await this.resolveAudienceUseCase.execute({
      tenantId,
      announcement,
    });
    return employees.length;
  }
}
