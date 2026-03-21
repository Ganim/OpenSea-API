import type { AiFavoriteQueriesRepository } from '@/repositories/ai/ai-favorite-queries-repository';

interface DeleteFavoriteRequest {
  tenantId: string;
  userId: string;
  favoriteId: string;
}

export class DeleteFavoriteUseCase {
  constructor(private favoritesRepository: AiFavoriteQueriesRepository) {}

  async execute(request: DeleteFavoriteRequest) {
    await this.favoritesRepository.delete(
      request.favoriteId,
      request.tenantId,
      request.userId,
    );

    return { success: true };
  }
}
