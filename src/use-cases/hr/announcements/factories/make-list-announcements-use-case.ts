import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { ListAnnouncementsUseCase } from '../list-announcements';

export function makeListAnnouncementsUseCase(): ListAnnouncementsUseCase {
  const companyAnnouncementsRepository =
    new PrismaCompanyAnnouncementsRepository();
  return new ListAnnouncementsUseCase(companyAnnouncementsRepository);
}
