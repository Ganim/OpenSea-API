import { prisma } from '@/lib/prisma';
import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { CancelRequestUseCase } from '../cancel-request';

export function makeCancelRequestUseCase() {
  const requestsRepository = new PrismaRequestsRepository(prisma);
  const requestHistoryRepository = new PrismaRequestHistoryRepository(prisma);
  const createNotificationUseCase = makeCreateNotificationUseCase();

  return new CancelRequestUseCase(
    requestsRepository,
    requestHistoryRepository,
    createNotificationUseCase,
  );
}
