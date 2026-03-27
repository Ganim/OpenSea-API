import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { UpdateAnnouncementUseCase } from '../update-announcement';

export function makeUpdateAnnouncementUseCase(): UpdateAnnouncementUseCase {
  const companyAnnouncementsRepository =
    new PrismaCompanyAnnouncementsRepository();
  return new UpdateAnnouncementUseCase(companyAnnouncementsRepository);
}
