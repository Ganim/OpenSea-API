import { prisma } from '@/lib/prisma';
import type {
  AiFavoriteQueriesRepository,
  AiFavoriteQueryDTO,
  CreateFavoriteQuerySchema,
  FindManyFavoriteQueriesOptions,
  FindManyFavoriteQueriesResult,
} from '../ai-favorite-queries-repository';
import type { AiFavoriteCategory, Prisma } from '@prisma/generated/client.js';

export class PrismaAiFavoriteQueriesRepository
  implements AiFavoriteQueriesRepository
{
  async create(data: CreateFavoriteQuerySchema): Promise<AiFavoriteQueryDTO> {
    const raw = await prisma.aiFavoriteQuery.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        query: data.query,
        shortcut: data.shortcut,
        category: (data.category as AiFavoriteCategory) ?? 'GENERAL',
      },
    });

    return raw;
  }

  async findMany(
    options: FindManyFavoriteQueriesOptions,
  ): Promise<FindManyFavoriteQueriesResult> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AiFavoriteQueryWhereInput = {
      tenantId: options.tenantId,
      userId: options.userId,
    };

    if (options.category) {
      where.category = options.category as AiFavoriteCategory;
    }

    const [favorites, total] = await Promise.all([
      prisma.aiFavoriteQuery.findMany({
        where,
        orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.aiFavoriteQuery.count({ where }),
    ]);

    return { favorites, total };
  }

  async delete(id: string, tenantId: string, userId: string): Promise<void> {
    await prisma.aiFavoriteQuery.deleteMany({
      where: { id, tenantId, userId },
    });
  }

  async incrementUsage(id: string): Promise<void> {
    await prisma.aiFavoriteQuery.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }
}
