import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { CancelRequestUseCase } from '../cancel-request';
import { NotificationClientRequestNotifier } from '../helpers/request-notifier';

export function makeCancelRequestUseCase() {
  return new CancelRequestUseCase(
    new PrismaRequestsRepository(),
    new PrismaRequestHistoryRepository(),
    new NotificationClientRequestNotifier(),
  );
}
