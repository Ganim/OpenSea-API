import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { WatchCardUseCase } from '../watch-card';

export function makeWatchCardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardWatchersRepository = new PrismaCardWatchersRepository();
  return new WatchCardUseCase(
    boardsRepository,
    cardsRepository,
    cardWatchersRepository,
  );
}
