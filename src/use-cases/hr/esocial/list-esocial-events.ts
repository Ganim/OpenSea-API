import { prisma } from '@/lib/prisma';

type EsocialEventStatus =
  | 'DRAFT'
  | 'REVIEWED'
  | 'APPROVED'
  | 'TRANSMITTING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ERROR';

export interface ListEsocialEventsRequest {
  tenantId: string;
  page: number;
  perPage: number;
  status?: EsocialEventStatus | EsocialEventStatus[];
  eventType?: string;
  search?: string;
}

export interface ListEsocialEventsResponse {
  events: Array<{
    id: string;
    eventType: string;
    description: string;
    status: string;
    referenceName: string | null;
    referenceType: string | null;
    deadline: string | null;
    receipt: string | null;
    rejectionCode: string | null;
    rejectionMessage: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    total: number;
    page: number;
    perPage: number;
    pages: number;
  };
}

export class ListEsocialEventsUseCase {
  async execute(
    request: ListEsocialEventsRequest,
  ): Promise<ListEsocialEventsResponse> {
    const { tenantId, page, perPage, status, eventType, search } = request;

    const where: Record<string, unknown> = { tenantId };

    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { referenceName: { contains: search, mode: 'insensitive' } },
        { eventType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.esocialEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.esocialEvent.count({ where }),
    ]);

    return {
      events: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        description: e.description,
        status: e.status,
        referenceName: e.referenceName,
        referenceType: e.referenceType,
        deadline: e.deadline?.toISOString() || null,
        receipt: e.receipt,
        rejectionCode: e.rejectionCode,
        rejectionMessage: e.rejectionMessage,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
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
