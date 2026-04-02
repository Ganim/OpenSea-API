import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';

export type EventStatusAction = 'review' | 'approve' | 'reject' | 'rectify';

export interface UpdateEventStatusRequest {
  tenantId: string;
  eventId: string;
  action: EventStatusAction;
  userId: string;
  rejectionReason?: string;
}

export interface UpdateEventStatusResponse {
  event: {
    id: string;
    status: string;
  };
}

const VALID_TRANSITIONS: Record<
  string,
  Record<EventStatusAction, string | null>
> = {
  DRAFT: {
    review: 'REVIEWED',
    approve: 'APPROVED',
    reject: null,
    rectify: null,
  },
  REVIEWED: {
    review: null,
    approve: 'APPROVED',
    reject: 'DRAFT',
    rectify: null,
  },
  APPROVED: {
    review: null,
    approve: null,
    reject: 'DRAFT',
    rectify: null,
  },
  REJECTED: {
    review: null,
    approve: null,
    reject: null,
    rectify: 'DRAFT', // Creates a new event based on this one
  },
  ACCEPTED: {
    review: null,
    approve: null,
    reject: null,
    rectify: 'DRAFT',
  },
};

export class UpdateEventStatusUseCase {
  async execute(
    request: UpdateEventStatusRequest,
  ): Promise<UpdateEventStatusResponse> {
    const { tenantId, eventId, action, userId, rejectionReason } = request;

    const event = await prisma.esocialEvent.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new ResourceNotFoundError('Evento não encontrado.');
    }

    const transitions = VALID_TRANSITIONS[event.status];
    if (!transitions) {
      throw new BadRequestError(
        `Status ${event.status} não permite transições.`,
      );
    }

    const newStatus = transitions[action];
    if (!newStatus) {
      throw new BadRequestError(
        `Ação "${action}" não é permitida para eventos com status "${event.status}".`,
      );
    }

    // Handle rectification: create a new event based on the rejected/accepted one
    if (action === 'rectify') {
      const rectifiedEvent = await prisma.esocialEvent.create({
        data: {
          tenantId,
          eventType: event.eventType,
          description: `[Retificação] ${event.description}`,
          status: 'DRAFT',
          referenceId: event.referenceId,
          referenceName: event.referenceName,
          referenceType: event.referenceType,
          periodStart: event.periodStart,
          periodEnd: event.periodEnd,
          deadline: event.deadline,
          xmlContent: event.xmlContent,
          rectifiedEventId: event.id,
          createdBy: userId,
        },
      });

      return {
        event: {
          id: rectifiedEvent.id,
          status: rectifiedEvent.status,
        },
      };
    }

    // Update event status
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (action === 'review') {
      updateData.reviewedBy = userId;
      updateData.reviewedAt = new Date();
    } else if (action === 'approve') {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    } else if (action === 'reject') {
      updateData.rejectionMessage = rejectionReason || null;
    }

    const updated = await prisma.esocialEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    return {
      event: {
        id: updated.id,
        status: updated.status,
      },
    };
  }
}
