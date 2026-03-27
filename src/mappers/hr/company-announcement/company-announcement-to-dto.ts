import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';

export interface CompanyAnnouncementDTO {
  id: string;
  title: string;
  content: string;
  priority: string;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
  authorEmployeeId?: string | null;
  targetDepartmentIds?: string[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function companyAnnouncementToDTO(
  announcement: CompanyAnnouncement,
): CompanyAnnouncementDTO {
  return {
    id: announcement.id.toString(),
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    publishedAt: announcement.publishedAt ?? null,
    expiresAt: announcement.expiresAt ?? null,
    authorEmployeeId: announcement.authorEmployeeId?.toString() ?? null,
    targetDepartmentIds: announcement.targetDepartmentIds ?? null,
    isActive: announcement.isActive,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}
