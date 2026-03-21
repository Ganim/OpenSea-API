import { PrismaAiFavoriteQueriesRepository } from '@/repositories/ai/prisma/prisma-ai-favorite-queries-repository';
import { ListFavoritesUseCase } from '../list-favorites';

export function makeListFavoritesUseCase() {
  const favoritesRepository = new PrismaAiFavoriteQueriesRepository();
  return new ListFavoritesUseCase(favoritesRepository);
}
