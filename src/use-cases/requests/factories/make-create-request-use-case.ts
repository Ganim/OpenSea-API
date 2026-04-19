import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { CreateRequestUseCase } from '../create-request';
import { NotificationClientRequestNotifier } from '../helpers/request-notifier';

export function makeCreateRequestUseCase() {
  return new CreateRequestUseCase(
    new PrismaRequestsRepository(),
    new PrismaRequestHistoryRepository(),
    new NotificationClientRequestNotifier(),
  );
}
