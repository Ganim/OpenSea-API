import { PrismaAiFavoriteQueriesRepository } from '@/repositories/ai/prisma/prisma-ai-favorite-queries-repository';
import { DeleteFavoriteUseCase } from '../delete-favorite';

export function makeDeleteFavoriteUseCase() {
  const favoritesRepository = new PrismaAiFavoriteQueriesRepository();
  return new DeleteFavoriteUseCase(favoritesRepository);
}
