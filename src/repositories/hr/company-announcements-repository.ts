import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';

export interface PaginatedAnnouncementsResult {
  announcements: CompanyAnnouncement[];
  total: number;
}

export interface CompanyAnnouncementsRepository {
  create(announcement: CompanyAnnouncement): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<CompanyAnnouncement | null>;
  findManyActive(
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedAnnouncementsResult>;
  save(announcement: CompanyAnnouncement): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
