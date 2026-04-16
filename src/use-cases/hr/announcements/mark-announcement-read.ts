import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AnnouncementReadReceipt } from '@/entities/hr/announcement-read-receipt';
import type { AnnouncementReadReceiptsRepository } from '@/repositories/hr/announcement-read-receipts-repository';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface MarkAnnouncementReadInput {
  tenantId: string;
  announcementId: string;
  /**
   * The authenticated user's id — resolved to the matching {@link Employee}
   * before persisting the read receipt.
   */
  userId: string;
}

export interface MarkAnnouncementReadOutput {
  receipt: AnnouncementReadReceipt;
}

/**
 * Marks a {@link CompanyAnnouncement} as read by the employee linked to the
 * authenticated user. Idempotent — calling it more than once for the same
 * (announcement, employee) pair returns the existing receipt unchanged.
 */
export class MarkAnnouncementReadUseCase {
  constructor(
    private readonly announcementsRepository: CompanyAnnouncementsRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly receiptsRepository: AnnouncementReadReceiptsRepository,
  ) {}

  async execute(
    input: MarkAnnouncementReadInput,
  ): Promise<MarkAnnouncementReadOutput> {
    const { tenantId, announcementId, userId } = input;

    const announcement = await this.announcementsRepository.findById(
      new UniqueEntityID(announcementId),
      tenantId,
    );

    if (!announcement) {
      throw new ResourceNotFoundError('Announcement not found');
    }

    const employee = await this.employeesRepository.findByUserId(
      new UniqueEntityID(userId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError(
        'No employee linked to the current user in this tenant',
      );
    }

    const receipt = await this.receiptsRepository.markAsRead({
      tenantId: announcement.tenantId,
      announcementId: announcement.id,
      employeeId: employee.id,
    });

    return { receipt };
  }
}
