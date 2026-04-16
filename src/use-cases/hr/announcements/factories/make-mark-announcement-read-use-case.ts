import { PrismaAnnouncementReadReceiptsRepository } from '@/repositories/hr/prisma/prisma-announcement-read-receipts-repository';
import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { MarkAnnouncementReadUseCase } from '../mark-announcement-read';

export function makeMarkAnnouncementReadUseCase(): MarkAnnouncementReadUseCase {
  return new MarkAnnouncementReadUseCase(
    new PrismaCompanyAnnouncementsRepository(),
    new PrismaEmployeesRepository(),
    new PrismaAnnouncementReadReceiptsRepository(),
  );
}
