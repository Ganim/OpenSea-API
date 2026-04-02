import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import type {
  CompanyAnnouncementsRepository,
  PaginatedAnnouncementsResult,
} from '../company-announcements-repository';

export class InMemoryCompanyAnnouncementsRepository
  implements CompanyAnnouncementsRepository
{
  public items: CompanyAnnouncement[] = [];

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
  ): Promise<PaginatedAnnouncementsResult> {
    const filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId && item.isActive,
    );

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
