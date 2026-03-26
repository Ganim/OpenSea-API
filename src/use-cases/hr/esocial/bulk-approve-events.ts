import { prisma } from '@/lib/prisma';

export interface BulkApproveEventsRequest {
  tenantId: string;
  eventIds: string[];
  userId: string;
}

export interface BulkApproveEventsResponse {
  approvedCount: number;
  skippedCount: number;
  errors: Array<{ id: string; reason: string }>;
}

export class BulkApproveEventsUseCase {
  async execute(
    request: BulkApproveEventsRequest,
  ): Promise<BulkApproveEventsResponse> {
    const { tenantId, eventIds, userId } = request;

    let approvedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ id: string; reason: string }> = [];

    // Get all events
    const events = await prisma.esocialEvent.findMany({
      where: {
        id: { in: eventIds },
        tenantId,
      },
    });

    for (const event of events) {
      // Only DRAFT and REVIEWED events can be approved
      if (event.status !== 'DRAFT' && event.status !== 'REVIEWED') {
        skippedCount++;
        errors.push({
          id: event.id,
          reason: `Evento com status "${event.status}" não pode ser aprovado.`,
        });
        continue;
      }

      if (!event.xmlContent) {
        skippedCount++;
        errors.push({
          id: event.id,
          reason: 'Evento sem conteúdo XML não pode ser aprovado.',
        });
        continue;
      }

      await prisma.esocialEvent.update({
        where: { id: event.id },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });

      approvedCount++;
    }

    // Count events not found
    const foundIds = events.map((e) => e.id);
    for (const id of eventIds) {
      if (!foundIds.includes(id)) {
        skippedCount++;
        errors.push({ id, reason: 'Evento não encontrado.' });
      }
    }

    return { approvedCount, skippedCount, errors };
  }
}
