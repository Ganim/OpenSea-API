import { PrismaAnnouncementReadReceiptsRepository } from '@/repositories/hr/prisma/prisma-announcement-read-receipts-repository';
import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { GetAnnouncementStatsUseCase } from '../get-announcement-stats';
import { makeResolveAudienceUseCase } from './make-resolve-audience-use-case';

export function makeGetAnnouncementStatsUseCase(): GetAnnouncementStatsUseCase {
  return new GetAnnouncementStatsUseCase(
    new PrismaCompanyAnnouncementsRepository(),
    new PrismaAnnouncementReadReceiptsRepository(),
    makeResolveAudienceUseCase(),
  );
}
