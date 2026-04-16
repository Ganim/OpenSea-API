import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  AnnouncementAudienceTargets,
  AnnouncementPriority,
} from '@/entities/hr/company-announcement';

/**
 * Reads the raw `targetDepartmentIds` Json column and returns either:
 *  - the legacy `string[]` (when the value is an array)
 *  - the structured {@link AnnouncementAudienceTargets} (when the value is an
 *    object containing any of the known dimensions)
 *  - `undefined` when the column is null/empty
 */
function decodeTargetDepartmentIds(
  raw: unknown,
): string[] | AnnouncementAudienceTargets | undefined {
  if (raw == null) return undefined;

  if (Array.isArray(raw)) {
    return raw as string[];
  }

  if (typeof raw === 'object') {
    return raw as AnnouncementAudienceTargets;
  }

  return undefined;
}

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
    targetDepartmentIds: decodeTargetDepartmentIds(raw.targetDepartmentIds),
    isActive: raw.isActive as boolean,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
}
