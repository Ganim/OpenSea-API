import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { NotificationClientRequestNotifier } from '../helpers/request-notifier';
import { RequestInfoUseCase } from '../request-info';

export function makeRequestInfoUseCase() {
  return new RequestInfoUseCase(
    new PrismaRequestsRepository(),
    new PrismaRequestHistoryRepository(),
    new NotificationClientRequestNotifier(),
  );
}
