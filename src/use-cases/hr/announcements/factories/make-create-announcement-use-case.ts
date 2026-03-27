import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { CreateAnnouncementUseCase } from '../create-announcement';

export function makeCreateAnnouncementUseCase(): CreateAnnouncementUseCase {
  const companyAnnouncementsRepository =
    new PrismaCompanyAnnouncementsRepository();
  return new CreateAnnouncementUseCase(companyAnnouncementsRepository);
}
