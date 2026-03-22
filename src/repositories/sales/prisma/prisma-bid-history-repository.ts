import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidHistory } from '@/entities/sales/bid-history';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidHistoryRepository,
  FindManyBidHistoryPaginatedParams,
} from '../bid-history-repository';
import type { BidHistoryAction as PrismaBidHistoryAction } from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): BidHistory {
  return BidHistory.create(
    {
      bidId: new UniqueEntityID(data.bidId as string),
      tenantId: new UniqueEntityID(data.tenantId as string),
      action: data.action as BidHistory['action'],
      description: data.description as string,
      metadata: (data.metadata as Record<string, unknown>) ?? undefined,
      performedByUserId: data.performedByUserId ? new UniqueEntityID(data.performedByUserId as string) : undefined,
      performedByAi: data.performedByAi as boolean,
      isReversible: data.isReversible as boolean,
      createdAt: data.createdAt as Date,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidHistoryRepository implements BidHistoryRepository {
  async create(history: BidHistory): Promise<void> {
    await prisma.bidHistory.create({
      data: {
        id: history.id.toString(),
        bidId: history.bidId.toString(),
        tenantId: history.tenantId.toString(),
        action: history.action as PrismaBidHistoryAction,
        description: history.description,
        metadata: (history.metadata as Prisma.InputJsonValue) ?? undefined,
        performedByUserId: history.performedByUserId?.toString(),
        performedByAi: history.performedByAi,
        isReversible: history.isReversible,
        createdAt: history.createdAt,
      },
    });
  }

  async findManyByBidId(params: FindManyBidHistoryPaginatedParams): Promise<PaginatedResult<BidHistory>> {
    const where = {
      tenantId: params.tenantId,
      bidId: params.bidId,
    };

    const [data, total] = await Promise.all([
      prisma.bidHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bidHistory.count({ where }),
    ]);

    return {
      data: data.map((d) => mapToDomain(d as unknown as Record<string, unknown>)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
