import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AnnouncementReadReceipt } from '@/entities/hr/announcement-read-receipt';

export interface AnnouncementReadReceiptsRepository {
  /**
   * Idempotent — returns the existing receipt when the (announcementId,
   * employeeId) pair is already persisted, otherwise creates a new one.
   */
  markAsRead(params: {
    tenantId: UniqueEntityID;
    announcementId: UniqueEntityID;
    employeeId: UniqueEntityID;
    readAt?: Date;
  }): Promise<AnnouncementReadReceipt>;

  findByAnnouncementAndEmployee(
    announcementId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<AnnouncementReadReceipt | null>;

  findManyByAnnouncement(
    announcementId: UniqueEntityID,
    tenantId: string,
  ): Promise<AnnouncementReadReceipt[]>;

  countByAnnouncement(
    announcementId: UniqueEntityID,
    tenantId: string,
  ): Promise<number>;

  /**
   * Returns the set of `announcementId`s that the given employee has already
   * read — used to enrich list endpoints with `isReadByMe`.
   */
  findReadAnnouncementIdsByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    announcementIds: string[],
  ): Promise<Set<string>>;

  /**
   * Returns a map of `announcementId -> readCount` for the supplied ids —
   * used to enrich list endpoints with `readCount`.
   */
  countByAnnouncementIds(
    announcementIds: string[],
    tenantId: string,
  ): Promise<Map<string, number>>;
}
