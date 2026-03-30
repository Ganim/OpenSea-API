import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';

export interface GetEsocialEventRequest {
  tenantId: string;
  eventId: string;
}

export interface GetEsocialEventResponse {
  event: {
    id: string;
    eventType: string;
    description: string;
    status: string;
    referenceId: string | null;
    referenceName: string | null;
    referenceType: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    deadline: string | null;
    xmlContent: string | null;
    signedXml: string | null;
    receipt: string | null;
    rejectionCode: string | null;
    rejectionMessage: string | null;
    retryCount: number;
    nextRetryAt: string | null;
    rectifiedEventId: string | null;
    batchId: string | null;
    createdBy: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export class GetEsocialEventUseCase {
  async execute(
    request: GetEsocialEventRequest,
  ): Promise<GetEsocialEventResponse> {
    const { tenantId, eventId } = request;

    const event = await prisma.esocialEvent.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new ResourceNotFoundError('Evento não encontrado.');
    }

    return {
      event: {
        id: event.id,
        eventType: event.eventType,
        description: event.description,
        status: event.status,
        referenceId: event.referenceId,
        referenceName: event.referenceName,
        referenceType: event.referenceType,
        periodStart: event.periodStart?.toISOString() || null,
        periodEnd: event.periodEnd?.toISOString() || null,
        deadline: event.deadline?.toISOString() || null,
        xmlContent: event.xmlContent,
        signedXml: event.signedXml,
        receipt: event.receipt,
        rejectionCode: event.rejectionCode,
        rejectionMessage: event.rejectionMessage,
        retryCount: event.retryCount,
        nextRetryAt: event.nextRetryAt?.toISOString() || null,
        rectifiedEventId: event.rectifiedEventId,
        batchId: event.batchId,
        createdBy: event.createdBy,
        reviewedBy: event.reviewedBy,
        reviewedAt: event.reviewedAt?.toISOString() || null,
        approvedBy: event.approvedBy,
        approvedAt: event.approvedAt?.toISOString() || null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      },
    };
  }
}
