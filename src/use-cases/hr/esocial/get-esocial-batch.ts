import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';

export interface GetEsocialBatchRequest {
  tenantId: string;
  batchId: string;
}

export interface GetEsocialBatchResponse {
  batch: {
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
    retryCount: number;
    nextRetryAt: string | null;
    createdBy: string | null;
    createdAt: string;
    events: Array<{
      id: string;
      eventType: string;
      description: string;
      status: string;
      referenceName: string | null;
      receipt: string | null;
      rejectionCode: string | null;
      rejectionMessage: string | null;
    }>;
  };
}

export class GetEsocialBatchUseCase {
  async execute(
    request: GetEsocialBatchRequest,
  ): Promise<GetEsocialBatchResponse> {
    const { tenantId, batchId } = request;

    const batch = await prisma.esocialBatch.findFirst({
      where: { id: batchId, tenantId },
      include: {
        events: {
          select: {
            id: true,
            eventType: true,
            description: true,
            status: true,
            referenceName: true,
            receipt: true,
            rejectionCode: true,
            rejectionMessage: true,
          },
        },
      },
    });

    if (!batch) {
      throw new ResourceNotFoundError('Lote não encontrado.');
    }

    return {
      batch: {
        id: batch.id,
        protocol: batch.protocol,
        status: batch.status,
        environment: batch.environment,
        totalEvents: batch.totalEvents,
        acceptedCount: batch.acceptedCount,
        rejectedCount: batch.rejectedCount,
        transmittedAt: batch.transmittedAt?.toISOString() || null,
        checkedAt: batch.checkedAt?.toISOString() || null,
        errorMessage: batch.errorMessage,
        retryCount: batch.retryCount,
        nextRetryAt: batch.nextRetryAt?.toISOString() || null,
        createdBy: batch.createdBy,
        createdAt: batch.createdAt.toISOString(),
        events: batch.events,
      },
    };
  }
}
