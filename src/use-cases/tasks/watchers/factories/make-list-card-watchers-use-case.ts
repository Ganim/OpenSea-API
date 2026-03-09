import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { ListCardWatchersUseCase } from '../list-card-watchers';

export function makeListCardWatchersUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardWatchersRepository = new PrismaCardWatchersRepository();
  return new ListCardWatchersUseCase(boardsRepository, cardWatchersRepository);
}
