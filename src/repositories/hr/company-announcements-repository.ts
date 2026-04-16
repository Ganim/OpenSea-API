import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';

export interface PaginatedAnnouncementsResult {
  announcements: CompanyAnnouncement[];
  total: number;
}

export interface FindManyActiveFilters {
  /**
   * When supplied along with {@link unreadOnly} `true`, excludes every
   * announcement that already has a read receipt for this employee.
   */
  currentEmployeeId?: UniqueEntityID;
  unreadOnly?: boolean;
}

export interface CompanyAnnouncementsRepository {
  create(announcement: CompanyAnnouncement): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CompanyAnnouncement | null>;
  findManyActive(
    tenantId: string,
    skip: number,
    take: number,
    filters?: FindManyActiveFilters,
  ): Promise<PaginatedAnnouncementsResult>;
  save(announcement: CompanyAnnouncement): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
