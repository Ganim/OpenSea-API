import { PrismaAnnouncementReadReceiptsRepository } from '@/repositories/hr/prisma/prisma-announcement-read-receipts-repository';
import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { ListAnnouncementReceiptsUseCase } from '../list-announcement-receipts';
import { makeResolveAudienceUseCase } from './make-resolve-audience-use-case';

export function makeListAnnouncementReceiptsUseCase(): ListAnnouncementReceiptsUseCase {
  return new ListAnnouncementReceiptsUseCase(
    new PrismaCompanyAnnouncementsRepository(),
    new PrismaAnnouncementReadReceiptsRepository(),
    makeResolveAudienceUseCase(),
  );
}
