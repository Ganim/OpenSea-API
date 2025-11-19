import { prisma } from '@/lib/prisma';
import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { RequestInfoUseCase } from '../request-info';

export function makeRequestInfoUseCase() {
  const requestsRepository = new PrismaRequestsRepository(prisma);
  const requestHistoryRepository = new PrismaRequestHistoryRepository(prisma);
  const createNotificationUseCase = makeCreateNotificationUseCase();

  return new RequestInfoUseCase(
    requestsRepository,
    requestHistoryRepository,
    createNotificationUseCase,
  );
}
