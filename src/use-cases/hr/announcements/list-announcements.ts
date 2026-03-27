import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import type { CompanyAnnouncementsRepository } from '@/repositories/hr/company-announcements-repository';

export interface ListAnnouncementsInput {
  tenantId: string;
  page: number;
  limit: number;
}

export interface ListAnnouncementsOutput {
  announcements: CompanyAnnouncement[];
  total: number;
}

export class ListAnnouncementsUseCase {
  constructor(
    private companyAnnouncementsRepository: CompanyAnnouncementsRepository,
  ) {}

  async execute(
    input: ListAnnouncementsInput,
  ): Promise<ListAnnouncementsOutput> {
    const { tenantId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { announcements, total } =
      await this.companyAnnouncementsRepository.findManyActive(
        tenantId,
        skip,
        limit,
      );

    return { announcements, total };
  }
}
