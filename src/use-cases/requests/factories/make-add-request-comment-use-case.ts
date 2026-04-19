import { PrismaRequestCommentsRepository } from '@/repositories/requests/prisma/prisma-request-comments-repository';
import { PrismaRequestHistoryRepository } from '@/repositories/requests/prisma/prisma-request-history-repository';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { AddRequestCommentUseCase } from '../add-request-comment';
import { NotificationClientRequestNotifier } from '../helpers/request-notifier';

export function makeAddRequestCommentUseCase() {
  return new AddRequestCommentUseCase(
    new PrismaRequestsRepository(),
    new PrismaRequestCommentsRepository(),
    new PrismaRequestHistoryRepository(),
    new NotificationClientRequestNotifier(),
  );
}
