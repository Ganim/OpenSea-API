import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { TimelineEvent } from '@/entities/sales/timeline-event';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import { SALES_EVENTS } from '@/lib/events/sales-events';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

interface CreateDealUseCaseRequest {
  tenantId: string;
  title: string;
  customerId: string;
  contactId?: string;
  pipelineId: string;
  stageId: string;
  priority?: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: Date;
  source?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  assignedToUserId?: string;
  userId?: string;
}

interface CreateDealUseCaseResponse {
  deal: Deal;
}

export class CreateDealUseCase {
  constructor(
    private dealsRepository: DealsRepository,
    private customersRepository: CustomersRepository,
    private pipelinesRepository: PipelinesRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
    private timelineEventsRepository: TimelineEventsRepository,
  ) {}

  async execute(
    request: CreateDealUseCaseRequest,
  ): Promise<CreateDealUseCaseResponse> {
    const { tenantId, title, customerId, pipelineId, stageId } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    const customer = await this.customersRepository.findById(
      new UniqueEntityID(customerId),
      tenantId,
    );
    if (!customer) {
      throw new ResourceNotFoundError('Customer not found');
    }

    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(pipelineId),
      tenantId,
    );
    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found');
    }

    const stage = await this.pipelineStagesRepository.findById(
      new UniqueEntityID(stageId),
    );
    if (!stage) {
      throw new ResourceNotFoundError('Pipeline stage not found');
    }

    const deal = Deal.create({
      tenantId: new UniqueEntityID(tenantId),
      title: title.trim(),
      customerId: new UniqueEntityID(customerId),
      contactId: request.contactId
        ? new UniqueEntityID(request.contactId)
        : undefined,
      pipelineId: new UniqueEntityID(pipelineId),
      stageId: new UniqueEntityID(stageId),
      priority: request.priority ?? 'MEDIUM',
      value: request.value,
      currency: request.currency ?? 'BRL',
      expectedCloseDate: request.expectedCloseDate,
      source: request.source,
      tags: request.tags ?? [],
      customFields: request.customFields,
      assignedToUserId: request.assignedToUserId
        ? new UniqueEntityID(request.assignedToUserId)
        : undefined,
    });

    await this.dealsRepository.create(deal);

    const timelineEvent = TimelineEvent.create({
      tenantId: new UniqueEntityID(tenantId),
      dealId: deal.id,
      type: 'DEAL_CREATED',
      title: `Deal "${deal.title}" created`,
      metadata: {
        pipelineId,
        stageId,
        value: deal.value,
      },
      userId: request.userId
        ? new UniqueEntityID(request.userId)
        : undefined,
    });

    await this.timelineEventsRepository.create(timelineEvent);

    // Emit domain event for cross-module consumers
    try {
      await getTypedEventBus().publish({
        type: SALES_EVENTS.DEAL_CREATED,
        version: 1,
        tenantId,
        source: 'sales',
        sourceEntityType: 'deal',
        sourceEntityId: deal.id.toString(),
        data: {
          dealId: deal.id.toString(),
          customerId,
          value: deal.value ?? 0,
        },
        metadata: {
          userId: request.userId,
        },
      });
    } catch {
      // Event emission failure should not block the deal creation
    }

    return { deal };
  }
}
