import { PrismaRequestCommentsRepository } from '@/repositories/requests/prisma/prisma-request-comments-repository';
import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { AddRequestCommentUseCase } from '../add-request-comment';

export function makeAddRequestCommentUseCase() {
  const requestsRepository = new PrismaRequestsRepository();
  const requestCommentsRepository = new PrismaRequestCommentsRepository();
  const requestHistoryRepository = new PrismaRequestHistoryRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  return new AddRequestCommentUseCase(
    requestsRepository,
    requestCommentsRepository,
    requestHistoryRepository,
    createNotificationUseCase,
  );
}
