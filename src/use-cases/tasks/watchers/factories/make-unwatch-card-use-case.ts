import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { UnwatchCardUseCase } from '../unwatch-card';

export function makeUnwatchCardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardWatchersRepository = new PrismaCardWatchersRepository();
  return new UnwatchCardUseCase(boardsRepository, cardWatchersRepository);
}
