import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  AnnouncementPriority,
  CompanyAnnouncement,
} from '@/entities/hr/company-announcement';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';

export interface UpdateAnnouncementInput {
  tenantId: string;
  announcementId: string;
  title?: string;
  content?: string;
  priority?: string;
  expiresAt?: Date;
  targetDepartmentIds?: string[];
}

export interface UpdateAnnouncementOutput {
  announcement: CompanyAnnouncement;
}

export class UpdateAnnouncementUseCase {
  constructor(
    private companyAnnouncementsRepository: CompanyAnnouncementsRepository,
  ) {}

  async execute(
    input: UpdateAnnouncementInput,
  ): Promise<UpdateAnnouncementOutput> {
    const { tenantId, announcementId, ...updateData } = input;

    const announcement = await this.companyAnnouncementsRepository.findById(
      new UniqueEntityID(announcementId),
      tenantId,
    );

    if (!announcement) {
      throw new ResourceNotFoundError('Announcement not found');
    }

    announcement.updateDetails({
      title: updateData.title,
      content: updateData.content,
      priority: updateData.priority as AnnouncementPriority | undefined,
      expiresAt: updateData.expiresAt,
      targetDepartmentIds: updateData.targetDepartmentIds,
    });

    await this.companyAnnouncementsRepository.save(announcement);

    return { announcement };
  }
}
