import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { AssignRequestUseCase } from '../assign-request';
import { NotificationClientRequestNotifier } from '../helpers/request-notifier';

export function makeAssignRequestUseCase() {
  return new AssignRequestUseCase(
    new PrismaRequestsRepository(),
    new PrismaRequestHistoryRepository(),
    new NotificationClientRequestNotifier(),
  );
}
