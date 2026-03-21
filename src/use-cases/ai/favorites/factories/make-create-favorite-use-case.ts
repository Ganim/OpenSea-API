import { PrismaAiFavoriteQueriesRepository } from '@/repositories/ai/prisma/prisma-ai-favorite-queries-repository';
import { CreateFavoriteUseCase } from '../create-favorite';

export function makeCreateFavoriteUseCase() {
  const favoritesRepository = new PrismaAiFavoriteQueriesRepository();
  return new CreateFavoriteUseCase(favoritesRepository);
}
