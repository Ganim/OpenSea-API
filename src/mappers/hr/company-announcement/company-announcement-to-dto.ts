import type {
  AnnouncementAudienceTargets,
  CompanyAnnouncement,
} from '@/entities/hr/company-announcement';

export interface CompanyAnnouncementDTO {
  id: string;
  title: string;
  content: string;
  priority: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  authorEmployeeId: string | null;
  /**
   * Legacy field — preserved for backward compatibility. Equivalent to
   * `audienceTargets.departments`.
   */
  targetDepartmentIds: string[] | null;
  audienceTargets: AnnouncementAudienceTargets;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function companyAnnouncementToDTO(
  announcement: CompanyAnnouncement,
): CompanyAnnouncementDTO {
  const audienceTargets = announcement.audienceTargets;
  return {
    id: announcement.id.toString(),
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    publishedAt: announcement.publishedAt ?? null,
    expiresAt: announcement.expiresAt ?? null,
    authorEmployeeId: announcement.authorEmployeeId?.toString() ?? null,
    targetDepartmentIds:
      audienceTargets.departments && audienceTargets.departments.length > 0
        ? audienceTargets.departments
        : null,
    audienceTargets,
    isActive: announcement.isActive,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}
