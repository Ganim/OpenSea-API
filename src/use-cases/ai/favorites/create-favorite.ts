import type { AiFavoriteQueriesRepository } from '@/repositories/ai/ai-favorite-queries-repository';

interface CreateFavoriteRequest {
  tenantId: string;
  userId: string;
  query: string;
  shortcut?: string;
  category?: string;
}

export class CreateFavoriteUseCase {
  constructor(private favoritesRepository: AiFavoriteQueriesRepository) {}

  async execute(request: CreateFavoriteRequest) {
    const favorite = await this.favoritesRepository.create({
      tenantId: request.tenantId,
      userId: request.userId,
      query: request.query,
      shortcut: request.shortcut,
      category: request.category,
    });

    return { favorite };
  }
}
