import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { CreateRequestUseCase } from '../create-request';

export function makeCreateRequestUseCase() {
  const requestsRepository = new PrismaRequestsRepository();
  const requestHistoryRepository = new PrismaRequestHistoryRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  return new CreateRequestUseCase(
    requestsRepository,
    requestHistoryRepository,
    createNotificationUseCase,
  );
}
