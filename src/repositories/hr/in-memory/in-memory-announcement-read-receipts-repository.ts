import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnnouncementReadReceipt } from '@/entities/hr/announcement-read-receipt';
import type { AnnouncementReadReceiptsRepository } from '../announcement-read-receipts-repository';

export class InMemoryAnnouncementReadReceiptsRepository
  implements AnnouncementReadReceiptsRepository
{
  public items: AnnouncementReadReceipt[] = [];

  async markAsRead(params: {
    tenantId: UniqueEntityID;
    announcementId: UniqueEntityID;
    employeeId: UniqueEntityID;
    readAt?: Date;
  }): Promise<AnnouncementReadReceipt> {
    const existing = this.items.find(
      (item) =>
        item.announcementId.equals(params.announcementId) &&
        item.employeeId.equals(params.employeeId) &&
        item.tenantId.equals(params.tenantId),
    );

    if (existing) {
      return existing;
    }

    const receipt = AnnouncementReadReceipt.create({
      tenantId: params.tenantId,
      announcementId: params.announcementId,
      employeeId: params.employeeId,
      readAt: params.readAt,
    });

    this.items.push(receipt);
    return receipt;
  }

  async findByAnnouncementAndEmployee(
    announcementId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<AnnouncementReadReceipt | null> {
    return (
      this.items.find(
        (item) =>
          item.announcementId.equals(announcementId) &&
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByAnnouncement(
    announcementId: UniqueEntityID,
    tenantId: string,
  ): Promise<AnnouncementReadReceipt[]> {
    return this.items.filter(
      (item) =>
        item.announcementId.equals(announcementId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async countByAnnouncement(
    announcementId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    const matching = await this.findManyByAnnouncement(
      announcementId,
      tenantId,
    );
    return matching.length;
  }

  async findReadAnnouncementIdsByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    announcementIds: string[],
  ): Promise<Set<string>> {
    const readIds = new Set<string>();
    for (const item of this.items) {
      if (
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId &&
        announcementIds.includes(item.announcementId.toString())
      ) {
        readIds.add(item.announcementId.toString());
      }
    }
    return readIds;
  }

  async countByAnnouncementIds(
    announcementIds: string[],
    tenantId: string,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    for (const announcementId of announcementIds) {
      counts.set(announcementId, 0);
    }
    for (const item of this.items) {
      if (item.tenantId.toString() !== tenantId) continue;
      const key = item.announcementId.toString();
      if (!announcementIds.includes(key)) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }
}
