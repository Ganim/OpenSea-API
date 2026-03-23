import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidMonitorEvent } from '@/entities/sales/bid-monitor-event';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidMonitorEventsRepository,
  FindManyBidMonitorEventsPaginatedParams,
} from '../bid-monitor-events-repository';
import type { BidMonitorEventType as PrismaBidMonitorEventType } from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): BidMonitorEvent {
  return BidMonitorEvent.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      bidId: new UniqueEntityID(data.bidId as string),
      type: data.type as BidMonitorEvent['type'],
      description: data.description as string,
      detectedAt: data.detectedAt as Date,
      detectedByAi: data.detectedByAi as boolean,
      portalData: (data.portalData as Record<string, unknown>) ?? undefined,
      actionRequired: data.actionRequired as boolean,
      actionTaken: (data.actionTaken as string) ?? undefined,
      actionTakenAt: (data.actionTakenAt as Date) ?? undefined,
      actionTakenByUserId: data.actionTakenByUserId
        ? new UniqueEntityID(data.actionTakenByUserId as string)
        : undefined,
      responseDeadline: (data.responseDeadline as Date) ?? undefined,
      responseStatus: (data.responseStatus as string) ?? undefined,
      createdAt: data.createdAt as Date,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidMonitorEventsRepository
  implements BidMonitorEventsRepository
{
  async create(event: BidMonitorEvent): Promise<void> {
    await prisma.bidMonitorEvent.create({
      data: {
        id: event.id.toString(),
        tenantId: event.tenantId.toString(),
        bidId: event.bidId.toString(),
        type: event.type as PrismaBidMonitorEventType,
        description: event.description,
        detectedAt: event.detectedAt,
        detectedByAi: event.detectedByAi,
        portalData: (event.portalData as Prisma.InputJsonValue) ?? undefined,
        actionRequired: event.actionRequired,
        actionTaken: event.actionTaken,
        actionTakenAt: event.actionTakenAt,
        actionTakenByUserId: event.actionTakenByUserId?.toString(),
        responseDeadline: event.responseDeadline,
        responseStatus: event.responseStatus,
        createdAt: event.createdAt,
      },
    });
  }

  async findManyByBidId(
    params: FindManyBidMonitorEventsPaginatedParams,
  ): Promise<PaginatedResult<BidMonitorEvent>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      bidId: params.bidId,
    };
    if (params.actionRequired !== undefined) {
      where.actionRequired = params.actionRequired;
    }

    const [data, total] = await Promise.all([
      prisma.bidMonitorEvent.findMany({
        where: where as Prisma.BidMonitorEventWhereInput,
        orderBy: { detectedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bidMonitorEvent.count({
        where: where as Prisma.BidMonitorEventWhereInput,
      }),
    ]);

    return {
      data: data.map((d) =>
        mapToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
