import type { AiFavoriteQueriesRepository } from '@/repositories/ai/ai-favorite-queries-repository';

interface ListFavoritesRequest {
  tenantId: string;
  userId: string;
  category?: string;
  page?: number;
  limit?: number;
}

export class ListFavoritesUseCase {
  constructor(private favoritesRepository: AiFavoriteQueriesRepository) {}

  async execute(request: ListFavoritesRequest) {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { favorites, total } = await this.favoritesRepository.findMany({
      tenantId: request.tenantId,
      userId: request.userId,
      category: request.category,
      page,
      limit,
    });

    return {
      favorites,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
