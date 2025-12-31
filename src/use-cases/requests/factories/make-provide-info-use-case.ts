import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { ProvideInfoUseCase } from '../provide-info';

export function makeProvideInfoUseCase() {
  const requestsRepository = new PrismaRequestsRepository();
  const requestHistoryRepository = new PrismaRequestHistoryRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  return new ProvideInfoUseCase(
    requestsRepository,
    requestHistoryRepository,
    createNotificationUseCase,
  );
}
