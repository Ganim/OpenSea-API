import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AnnouncementPriority } from '@/entities/hr/company-announcement';

export function mapCompanyAnnouncementPrismaToDomain(
  raw: Record<string, unknown>,
) {
  return {
    tenantId: new UniqueEntityID(raw.tenantId as string),
    title: raw.title as string,
    content: raw.content as string,
    priority: raw.priority as AnnouncementPriority,
    publishedAt: (raw.publishedAt as Date) ?? undefined,
    expiresAt: (raw.expiresAt as Date) ?? undefined,
    authorEmployeeId: raw.authorEmployeeId
      ? new UniqueEntityID(raw.authorEmployeeId as string)
      : undefined,
    targetDepartmentIds: raw.targetDepartmentIds
      ? (raw.targetDepartmentIds as string[])
      : undefined,
    isActive: raw.isActive as boolean,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
}
