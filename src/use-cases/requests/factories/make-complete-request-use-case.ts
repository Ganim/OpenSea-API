import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { CompleteRequestUseCase } from '../complete-request';
import { NotificationClientRequestNotifier } from '../helpers/request-notifier';

export function makeCompleteRequestUseCase() {
  return new CompleteRequestUseCase(
    new PrismaRequestsRepository(),
    new PrismaRequestHistoryRepository(),
    new NotificationClientRequestNotifier(),
  );
}
