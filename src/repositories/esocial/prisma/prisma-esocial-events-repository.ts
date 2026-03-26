import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import { prisma } from '@/lib/prisma';
import type {
  CreateEsocialEventData,
  EsocialEventsRepository,
  FindManyEsocialEventsParams,
  FindManyEsocialEventsResult,
} from '../esocial-events-repository';

function mapToDomain(data: any): EsocialEvent {
  return EsocialEvent.create(
    {
      tenantId: new UniqueEntityID(data.tenantId),
      eventType: data.eventType,
      status: data.status as EsocialEventStatus,
      referenceId: data.referenceId ?? undefined,
      referenceType: data.referenceType ?? undefined,
      xmlContent: data.xmlContent,
      xmlHash: data.xmlHash ?? undefined,
      reviewedBy: data.reviewedBy ?? undefined,
      reviewedAt: data.reviewedAt ?? undefined,
      reviewNotes: data.reviewNotes ?? undefined,
      approvedBy: data.approvedBy ?? undefined,
      approvedAt: data.approvedAt ?? undefined,
      batchId: data.batchId
        ? new UniqueEntityID(data.batchId)
        : undefined,
      protocol: data.protocol ?? undefined,
      receipt: data.receipt ?? undefined,
      transmittedAt: data.transmittedAt ?? undefined,
      responseAt: data.responseAt ?? undefined,
      responseXml: data.responseXml ?? undefined,
      rejectionCode: data.rejectionCode ?? undefined,
      rejectionMessage: data.rejectionMessage ?? undefined,
      retryCount: data.retryCount,
      nextRetryAt: data.nextRetryAt ?? undefined,
      originalEventId: data.originalEventId
        ? new UniqueEntityID(data.originalEventId)
        : undefined,
      isRectification: data.isRectification,
      deadline: data.deadline ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaEsocialEventsRepository
  implements EsocialEventsRepository
{
  async create(data: CreateEsocialEventData): Promise<EsocialEvent> {
    const result = await prisma.esocialEvent.create({
      data: {
        tenantId: data.tenantId,
        eventType: data.eventType,
        status: data.status ?? 'DRAFT',
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        xmlContent: data.xmlContent,
        xmlHash: data.xmlHash,
        originalEventId: data.originalEventId,
        isRectification: data.isRectification ?? false,
        deadline: data.deadline,
      },
    });

    return mapToDomain(result);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EsocialEvent | null> {
    const data = await prisma.esocialEvent.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!data) return null;

    return mapToDomain(data);
  }

  async findMany(
    params: FindManyEsocialEventsParams,
  ): Promise<FindManyEsocialEventsResult> {
    const { tenantId, page = 1, perPage = 20 } = params;

    const where: any = { tenantId };

    if (params.status) {
      where.status = params.status;
    }
    if (params.eventType) {
      where.eventType = params.eventType;
    }
    if (params.referenceId) {
      where.referenceId = params.referenceId;
    }
    if (params.referenceType) {
      where.referenceType = params.referenceType;
    }
    if (params.search) {
      where.OR = [
        { eventType: { contains: params.search, mode: 'insensitive' } },
        { referenceId: { contains: params.search, mode: 'insensitive' } },
        { protocol: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.esocialEvent.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.esocialEvent.count({ where }),
    ]);

    return {
      events: events.map(mapToDomain),
      total,
    };
  }

  async save(event: EsocialEvent): Promise<void> {
    await prisma.esocialEvent.update({
      where: { id: event.id.toString() },
      data: {
        status: event.status,
        xmlContent: event.xmlContent,
        xmlHash: event.xmlHash,
        reviewedBy: event.reviewedBy,
        reviewedAt: event.reviewedAt,
        reviewNotes: event.reviewNotes,
        approvedBy: event.approvedBy,
        approvedAt: event.approvedAt,
        batchId: event.batchId?.toString(),
        protocol: event.protocol,
        receipt: event.receipt,
        transmittedAt: event.transmittedAt,
        responseAt: event.responseAt,
        responseXml: event.responseXml,
        rejectionCode: event.rejectionCode,
        rejectionMessage: event.rejectionMessage,
        retryCount: event.retryCount,
        nextRetryAt: event.nextRetryAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.esocialEvent.delete({
      where: { id: id.toString() },
    });
  }
}
