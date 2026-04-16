import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyAnnouncement,
  type AnnouncementAudienceTargets,
  type AnnouncementPriority,
} from '@/entities/hr/company-announcement';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';
import type { ResolveAudienceUseCase } from './resolve-audience';

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
  /** @deprecated Prefer the structured {@link audienceTargets} payload. */
  targetDepartmentIds?: string[];
  targetTeamIds?: string[];
  targetRoleIds?: string[];
  targetEmployeeIds?: string[];
  publishNow?: boolean;
}

export interface CreateAnnouncementOutput {
  announcement: CompanyAnnouncement;
  notificationsCreated: number;
}

/**
 * Translates the controller's discrete `target*Ids` arrays into the
 * structured {@link AnnouncementAudienceTargets} object persisted on the
 * entity. Returns `undefined` when no dimension is supplied — semantically
 * equivalent to "broadcast to every active employee".
 */
function buildAudienceTargets(
  input: Pick<
    CreateAnnouncementInput,
    | 'targetDepartmentIds'
    | 'targetTeamIds'
    | 'targetRoleIds'
    | 'targetEmployeeIds'
  >,
): AnnouncementAudienceTargets | undefined {
  const departments = input.targetDepartmentIds ?? [];
  const teams = input.targetTeamIds ?? [];
  const roles = input.targetRoleIds ?? [];
  const employees = input.targetEmployeeIds ?? [];

  if (
    departments.length === 0 &&
    teams.length === 0 &&
    roles.length === 0 &&
    employees.length === 0
  ) {
    return undefined;
  }

  return { departments, teams, roles, employees };
}

export class CreateAnnouncementUseCase {
  constructor(
    private companyAnnouncementsRepository: CompanyAnnouncementsRepository,
    private resolveAudienceUseCase?: ResolveAudienceUseCase,
    private createNotificationUseCase?: CreateNotificationUseCase,
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

    const audienceTargets = buildAudienceTargets(input);

    const announcement = CompanyAnnouncement.create({
      tenantId: new UniqueEntityID(tenantId),
      title: title.trim(),
      content: content.trim(),
      priority: priority as AnnouncementPriority,
      expiresAt,
      authorEmployeeId: authorEmployeeId
        ? new UniqueEntityID(authorEmployeeId)
        : undefined,
      targetDepartmentIds: audienceTargets,
      isActive: true,
      publishedAt: publishNow ? new Date() : undefined,
    });

    await this.companyAnnouncementsRepository.create(announcement);

    let notificationsCreated = 0;

    if (
      announcement.isPublished() &&
      this.resolveAudienceUseCase &&
      this.createNotificationUseCase
    ) {
      notificationsCreated = await this.notifyAudience(announcement, tenantId);
    }

    return { announcement, notificationsCreated };
  }

  /**
   * Emits one in-app notification to each employee in the announcement's
   * resolved audience. Notifications go to the employee's linked `userId`;
   * employees without a linked user are silently skipped.
   *
   * Idempotent — relies on {@link CreateNotificationUseCase}'s built-in
   * dedup on (userId + entityType + entityId).
   */
  private async notifyAudience(
    announcement: CompanyAnnouncement,
    tenantId: string,
  ): Promise<number> {
    if (!this.resolveAudienceUseCase || !this.createNotificationUseCase) {
      return 0;
    }

    const { employees } = await this.resolveAudienceUseCase.execute({
      tenantId,
      announcement,
    });

    let notificationsCreated = 0;

    for (const employee of employees) {
      if (!employee.userId) continue;

      await this.createNotificationUseCase.execute({
        userId: employee.userId.toString(),
        title: `Novo comunicado: ${announcement.title}`,
        message: announcement.content.slice(0, 240),
        type: priorityToNotificationType(announcement.priority),
        priority: priorityToNotificationPriority(announcement.priority),
        channel: 'IN_APP',
        entityType: 'COMPANY_ANNOUNCEMENT',
        entityId: announcement.id.toString(),
        actionUrl: `/hr/announcements/${announcement.id.toString()}`,
        actionText: 'Ver comunicado',
      });
      notificationsCreated++;
    }

    return notificationsCreated;
  }
}

function priorityToNotificationType(
  priority: AnnouncementPriority,
): 'INFO' | 'WARNING' {
  if (priority === 'URGENT') return 'WARNING';
  if (priority === 'IMPORTANT') return 'WARNING';
  return 'INFO';
}

function priorityToNotificationPriority(
  priority: AnnouncementPriority,
): 'NORMAL' | 'HIGH' | 'URGENT' {
  if (priority === 'URGENT') return 'URGENT';
  if (priority === 'IMPORTANT') return 'HIGH';
  return 'NORMAL';
}
