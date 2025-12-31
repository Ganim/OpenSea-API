import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { CompleteRequestUseCase } from '../complete-request';

export function makeCompleteRequestUseCase() {
  const requestsRepository = new PrismaRequestsRepository();
  const requestHistoryRepository = new PrismaRequestHistoryRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  return new CompleteRequestUseCase(
    requestsRepository,
    requestHistoryRepository,
    createNotificationUseCase,
  );
}
