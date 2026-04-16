import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  AnnouncementAudienceTargets,
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
  /** @deprecated Prefer the structured {@link audienceTargets} payload. */
  targetDepartmentIds?: string[];
  targetTeamIds?: string[];
  targetRoleIds?: string[];
  targetEmployeeIds?: string[];
}

export interface UpdateAnnouncementOutput {
  announcement: CompanyAnnouncement;
}

/**
 * Returns `undefined` when no audience-related field was supplied — leaves
 * the persisted audience untouched. Returns an explicit
 * {@link AnnouncementAudienceTargets} object otherwise, defaulting missing
 * dimensions to empty arrays so partial updates fully replace the audience.
 */
function buildAudienceTargetsForUpdate(
  input: UpdateAnnouncementInput,
): AnnouncementAudienceTargets | undefined {
  const hasAnyAudienceField =
    input.targetDepartmentIds !== undefined ||
    input.targetTeamIds !== undefined ||
    input.targetRoleIds !== undefined ||
    input.targetEmployeeIds !== undefined;

  if (!hasAnyAudienceField) return undefined;

  return {
    departments: input.targetDepartmentIds ?? [],
    teams: input.targetTeamIds ?? [],
    roles: input.targetRoleIds ?? [],
    employees: input.targetEmployeeIds ?? [],
  };
}

export class UpdateAnnouncementUseCase {
  constructor(
    private companyAnnouncementsRepository: CompanyAnnouncementsRepository,
  ) {}

  async execute(
    input: UpdateAnnouncementInput,
  ): Promise<UpdateAnnouncementOutput> {
    const { tenantId, announcementId } = input;

    const announcement = await this.companyAnnouncementsRepository.findById(
      new UniqueEntityID(announcementId),
      tenantId,
    );

    if (!announcement) {
      throw new ResourceNotFoundError('Announcement not found');
    }

    announcement.updateDetails({
      title: input.title,
      content: input.content,
      priority: input.priority as AnnouncementPriority | undefined,
      expiresAt: input.expiresAt,
      targetDepartmentIds: buildAudienceTargetsForUpdate(input),
    });

    await this.companyAnnouncementsRepository.save(announcement);

    return { announcement };
  }
}
