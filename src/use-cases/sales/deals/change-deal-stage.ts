import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import { TimelineEvent } from '@/entities/sales/timeline-event';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

interface ChangeDealStageUseCaseRequest {
  id: string;
  tenantId: string;
  stageId: string;
  lostReason?: string;
}

interface ChangeDealStageUseCaseResponse {
  deal: Deal;
}

export class ChangeDealStageUseCase {
  constructor(
    private dealsRepository: DealsRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
    private timelineEventsRepository: TimelineEventsRepository,
  ) {}

  async execute(
    request: ChangeDealStageUseCaseRequest,
  ): Promise<ChangeDealStageUseCaseResponse> {
    const { id, tenantId, stageId, lostReason } = request;

    // 1. Find the deal
    const deal = await this.dealsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!deal) {
      throw new ResourceNotFoundError('Deal not found');
    }

    // 2. Validate the new stage exists
    const newStage = await this.pipelineStagesRepository.findById(
      new UniqueEntityID(stageId),
    );
    if (!newStage) {
      throw new ResourceNotFoundError('Stage not found');
    }

    // 3. Validate the new stage belongs to the deal's pipeline
    if (!newStage.pipelineId.equals(deal.pipelineId)) {
      throw new BadRequestError("Stage does not belong to the deal's pipeline");
    }

    // Get the old stage info for the timeline event
    const oldStage = await this.pipelineStagesRepository.findById(deal.stageId);
    const fromStageName = oldStage?.name ?? 'Unknown';
    const fromStageId = deal.stageId.toString();

    // 4. Update deal stage
    deal.stageId = new UniqueEntityID(stageId);
    deal.stageEnteredAt = new Date();

    // 5. Handle WON stage
    if (newStage.type === 'WON') {
      deal.status = 'WON';
      deal.wonAt = new Date();
      deal.closedAt = new Date();
    }

    // 6. Handle LOST stage
    if (newStage.type === 'LOST') {
      deal.status = 'LOST';
      deal.lostAt = new Date();
      deal.closedAt = new Date();
      if (lostReason) {
        deal.lostReason = lostReason;
      }
    }

    // Save the updated deal via changeStage
    await this.dealsRepository.changeStage(
      new UniqueEntityID(id),
      tenantId,
      new UniqueEntityID(stageId),
    );

    // 7. Create timeline event
    const timelineEvent = TimelineEvent.create({
      tenantId: new UniqueEntityID(tenantId),
      type: 'STAGE_CHANGE',
      dealId: deal.id,
      title: `Stage changed from ${fromStageName} to ${newStage.name}`,
      metadata: {
        fromStageId,
        fromStageName,
        toStageId: stageId,
        toStageName: newStage.name,
      },
    });

    await this.timelineEventsRepository.create(timelineEvent);

    return { deal };
  }
}
