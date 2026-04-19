import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { NotificationClientRequestNotifier } from '../helpers/request-notifier';
import { ProvideInfoUseCase } from '../provide-info';

export function makeProvideInfoUseCase() {
  return new ProvideInfoUseCase(
    new PrismaRequestsRepository(),
    new PrismaRequestHistoryRepository(),
    new NotificationClientRequestNotifier(),
  );
}
