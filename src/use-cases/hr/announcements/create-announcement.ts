import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyAnnouncement,
  type AnnouncementPriority,
} from '@/entities/hr/company-announcement';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';

const VALID_PRIORITIES: AnnouncementPriority[] = [
  'NORMAL',
  'IMPORTANT',
  'URGENT',
];

export interface CreateAnnouncementInput {
  tenantId: string;
  title: string;
  content: string;
  priority?: string;
  expiresAt?: Date;
  authorEmployeeId?: string;
  targetDepartmentIds?: string[];
  publishNow?: boolean;
}

export interface CreateAnnouncementOutput {
  announcement: CompanyAnnouncement;
}

export class CreateAnnouncementUseCase {
  constructor(
    private companyAnnouncementsRepository: CompanyAnnouncementsRepository,
  ) {}

  async execute(
    input: CreateAnnouncementInput,
  ): Promise<CreateAnnouncementOutput> {
    const {
      tenantId,
      title,
      content,
      priority = 'NORMAL',
      expiresAt,
      authorEmployeeId,
      targetDepartmentIds,
      publishNow = true,
    } = input;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Announcement title is required');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Announcement content is required');
    }

    if (!VALID_PRIORITIES.includes(priority as AnnouncementPriority)) {
      throw new BadRequestError(
        `Invalid priority: ${priority}. Valid priorities: ${VALID_PRIORITIES.join(', ')}`,
      );
    }

    const announcement = CompanyAnnouncement.create({
      tenantId: new UniqueEntityID(tenantId),
      title: title.trim(),
      content: content.trim(),
      priority: priority as AnnouncementPriority,
      expiresAt,
      authorEmployeeId: authorEmployeeId
        ? new UniqueEntityID(authorEmployeeId)
        : undefined,
      targetDepartmentIds,
      isActive: true,
      publishedAt: publishNow ? new Date() : undefined,
    });

    await this.companyAnnouncementsRepository.create(announcement);

    return { announcement };
  }
}
