import { prisma } from '@/lib/prisma';

export interface ListEsocialBatchesRequest {
  tenantId: string;
  page: number;
  perPage: number;
  status?: string;
}

export interface ListEsocialBatchesResponse {
  batches: Array<{
    id: string;
    protocol: string | null;
    status: string;
    environment: string;
    totalEvents: number;
    acceptedCount: number;
    rejectedCount: number;
    transmittedAt: string | null;
    checkedAt: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  meta: {
    total: number;
    page: number;
    perPage: number;
    pages: number;
  };
}

export class ListEsocialBatchesUseCase {
  async execute(
    request: ListEsocialBatchesRequest,
  ): Promise<ListEsocialBatchesResponse> {
    const { tenantId, page, perPage, status } = request;

    const where: Record<string, unknown> = { tenantId };
    if (status) {
      where.status = status;
    }

    const [batches, total] = await Promise.all([
      prisma.esocialBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.esocialBatch.count({ where }),
    ]);

    return {
      batches: batches.map((b) => ({
        id: b.id,
        protocol: b.protocol,
        status: b.status,
        environment: b.environment,
        totalEvents: b.totalEvents,
        acceptedCount: b.acceptedCount,
        rejectedCount: b.rejectedCount,
        transmittedAt: b.transmittedAt?.toISOString() || null,
        checkedAt: b.checkedAt?.toISOString() || null,
        errorMessage: b.errorMessage,
        createdAt: b.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        perPage,
        pages: Math.ceil(total / perPage),
      },
    };
  }
}
