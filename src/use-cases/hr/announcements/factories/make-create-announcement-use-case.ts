import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { CreateAnnouncementUseCase } from '../create-announcement';
import { makeResolveAudienceUseCase } from './make-resolve-audience-use-case';

export function makeCreateAnnouncementUseCase(): CreateAnnouncementUseCase {
  return new CreateAnnouncementUseCase(
    new PrismaCompanyAnnouncementsRepository(),
    makeResolveAudienceUseCase(),
    makeCreateNotificationUseCase(),
  );
}
