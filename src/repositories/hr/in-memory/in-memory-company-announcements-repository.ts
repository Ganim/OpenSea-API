import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import type {
  CompanyAnnouncementsRepository,
  FindManyActiveFilters,
  PaginatedAnnouncementsResult,
} from '../company-announcements-repository';
import type { InMemoryAnnouncementReadReceiptsRepository } from './in-memory-announcement-read-receipts-repository';

export class InMemoryCompanyAnnouncementsRepository
  implements CompanyAnnouncementsRepository
{
  public items: CompanyAnnouncement[] = [];

  /**
   * Optional companion repository — when provided, enables `unreadOnly`
   * filtering on {@link findManyActive}. Tests that don't exercise the
   * read-receipts feature can leave it unset.
   */
  public receiptsRepository?: InMemoryAnnouncementReadReceiptsRepository;

  async create(announcement: CompanyAnnouncement): Promise<void> {
    this.items.push(announcement);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CompanyAnnouncement | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyActive(
    tenantId: string,
    skip: number,
    take: number,
    filters: FindManyActiveFilters = {},
  ): Promise<PaginatedAnnouncementsResult> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId && item.isActive,
    );

    if (filters.unreadOnly && filters.currentEmployeeId) {
      const currentEmployeeId = filters.currentEmployeeId;
      const readAnnouncementIds = new Set(
        (this.receiptsRepository?.items ?? [])
          .filter(
            (receipt) =>
              receipt.employeeId.equals(currentEmployeeId) &&
              receipt.tenantId.toString() === tenantId,
          )
          .map((receipt) => receipt.announcementId.toString()),
      );
      filtered = filtered.filter(
        (item) => !readAnnouncementIds.has(item.id.toString()),
      );
    }

    return {
      announcements: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }

  async save(announcement: CompanyAnnouncement): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(announcement.id),
    );
    if (index >= 0) {
      this.items[index] = announcement;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.id.equals(id) && item.tenantId.toString() === tenantId),
    );
  }
}
