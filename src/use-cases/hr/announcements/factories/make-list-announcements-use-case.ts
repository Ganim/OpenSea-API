import { PrismaAnnouncementReadReceiptsRepository } from '@/repositories/hr/prisma/prisma-announcement-read-receipts-repository';
import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { ListAnnouncementsUseCase } from '../list-announcements';
import { makeResolveAudienceUseCase } from './make-resolve-audience-use-case';

export function makeListAnnouncementsUseCase(): ListAnnouncementsUseCase {
  return new ListAnnouncementsUseCase(
    new PrismaCompanyAnnouncementsRepository(),
    new PrismaAnnouncementReadReceiptsRepository(),
    new PrismaEmployeesRepository(),
    makeResolveAudienceUseCase(),
  );
}
