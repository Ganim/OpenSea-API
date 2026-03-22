export interface AiFavoriteQueryDTO {
  id: string;
  tenantId: string;
  userId: string;
  query: string;
  shortcut: string | null;
  category: string;
  usageCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface CreateFavoriteQuerySchema {
  tenantId: string;
  userId: string;
  query: string;
  shortcut?: string | null;
  category?: string;
}

export interface FindManyFavoriteQueriesOptions {
  tenantId: string;
  userId: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface FindManyFavoriteQueriesResult {
  favorites: AiFavoriteQueryDTO[];
  total: number;
}

export interface AiFavoriteQueriesRepository {
  create(data: CreateFavoriteQuerySchema): Promise<AiFavoriteQueryDTO>;
  findMany(
    options: FindManyFavoriteQueriesOptions,
  ): Promise<FindManyFavoriteQueriesResult>;
  delete(id: string, tenantId: string, userId: string): Promise<void>;
  incrementUsage(id: string): Promise<void>;
}
