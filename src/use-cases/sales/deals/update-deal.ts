import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import { TimelineEvent } from '@/entities/sales/timeline-event';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import { SALES_EVENTS } from '@/lib/events/sales-events';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

interface UpdateDealUseCaseRequest {
  id: string;
  tenantId: string;
  title?: string;
  contactId?: string | null;
  stageId?: string;
  status?: string;
  priority?: string;
  value?: number | null;
  expectedCloseDate?: Date | null;
  lostReason?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  position?: number;
  assignedToUserId?: string | null;
  userId?: string;
}

interface UpdateDealUseCaseResponse {
  deal: Deal;
}

export class UpdateDealUseCase {
  constructor(
    private dealsRepository: DealsRepository,
    private timelineEventsRepository: TimelineEventsRepository,
  ) {}

  async execute(
    request: UpdateDealUseCaseRequest,
  ): Promise<UpdateDealUseCaseResponse> {
    const { id, tenantId, userId, ...updates } = request;

    const deal = await this.dealsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!deal) {
      throw new ResourceNotFoundError('Deal not found');
    }

    const oldStageId = deal.stageId.toString();
    const oldStatus = deal.status;
    const oldValue = deal.value;

    if (updates.title !== undefined) deal.title = updates.title;
    if (updates.contactId !== undefined) {
      deal.contactId = updates.contactId
        ? new UniqueEntityID(updates.contactId)
        : undefined;
    }
    if (updates.stageId !== undefined) {
      deal.stageId = new UniqueEntityID(updates.stageId);
    }
    if (updates.status !== undefined) deal.status = updates.status;
    if (updates.priority !== undefined) deal.priority = updates.priority;
    if (updates.value !== undefined) {
      deal.value = updates.value ?? undefined;
    }
    if (updates.expectedCloseDate !== undefined) {
      deal.expectedCloseDate = updates.expectedCloseDate ?? undefined;
    }
    if (updates.lostReason !== undefined) deal.lostReason = updates.lostReason;
    if (updates.tags !== undefined) deal.tags = updates.tags;
    if (updates.customFields !== undefined)
      deal.customFields = updates.customFields;
    if (updates.position !== undefined) deal.position = updates.position;
    if (updates.assignedToUserId !== undefined) {
      deal.assignedToUserId = updates.assignedToUserId
        ? new UniqueEntityID(updates.assignedToUserId)
        : undefined;
    }

    await this.dealsRepository.save(deal);

    // Track stage changes
    if (updates.stageId && updates.stageId !== oldStageId) {
      const event = TimelineEvent.create({
        tenantId: new UniqueEntityID(tenantId),
        dealId: deal.id,
        type: 'STAGE_CHANGED',
        title: 'Deal moved to a new stage',
        metadata: {
          oldStageId,
          newStageId: updates.stageId,
        },
        userId: userId ? new UniqueEntityID(userId) : undefined,
      });
      await this.timelineEventsRepository.create(event);

      // Emit stage changed domain event
      try {
        await getTypedEventBus().publish({
          type: SALES_EVENTS.STAGE_CHANGED,
          version: 1,
          tenantId,
          source: 'sales',
          sourceEntityType: 'deal',
          sourceEntityId: deal.id.toString(),
          data: {
            dealId: deal.id.toString(),
            fromStage: oldStageId,
            toStage: updates.stageId,
          },
          metadata: { userId },
        });
      } catch {
        // Event emission failure should not block the deal update
      }
    }

    // Track status changes (won/lost)
    if (updates.status && updates.status !== oldStatus) {
      const typeMap: Record<string, string> = {
        WON: 'DEAL_WON',
        LOST: 'DEAL_LOST',
      };
      const eventType = typeMap[updates.status] ?? 'DEAL_UPDATED';
      const event = TimelineEvent.create({
        tenantId: new UniqueEntityID(tenantId),
        dealId: deal.id,
        type: eventType,
        title: `Deal status changed to ${updates.status}`,
        metadata: {
          oldStatus,
          newStatus: updates.status,
          lostReason: updates.lostReason,
        },
        userId: userId ? new UniqueEntityID(userId) : undefined,
      });
      await this.timelineEventsRepository.create(event);

      // Emit deal won/lost domain event
      try {
        if (updates.status === 'WON') {
          await getTypedEventBus().publish({
            type: SALES_EVENTS.DEAL_WON,
            version: 1,
            tenantId,
            source: 'sales',
            sourceEntityType: 'deal',
            sourceEntityId: deal.id.toString(),
            data: {
              dealId: deal.id.toString(),
              customerId: deal.customerId.toString(),
              value: deal.value ?? 0,
            },
            metadata: { userId },
          });
        } else if (updates.status === 'LOST') {
          await getTypedEventBus().publish({
            type: SALES_EVENTS.DEAL_LOST,
            version: 1,
            tenantId,
            source: 'sales',
            sourceEntityType: 'deal',
            sourceEntityId: deal.id.toString(),
            data: {
              dealId: deal.id.toString(),
              reason: updates.lostReason ?? '',
            },
            metadata: { userId },
          });
        }
      } catch {
        // Event emission failure should not block the deal update
      }
    }

    // Track value changes
    if (updates.value !== undefined && updates.value !== oldValue) {
      const event = TimelineEvent.create({
        tenantId: new UniqueEntityID(tenantId),
        dealId: deal.id,
        type: 'VALUE_CHANGED',
        title: 'Deal value updated',
        metadata: {
          oldValue,
          newValue: updates.value,
        },
        userId: userId ? new UniqueEntityID(userId) : undefined,
      });
      await this.timelineEventsRepository.create(event);
    }

    return { deal };
  }
}
