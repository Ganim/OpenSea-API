import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

interface CreateDealUseCaseRequest {
  tenantId: string;
  title: string;
  customerId: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: Date;
  probability?: number;
  assignedToUserId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  previousDealId?: string;
}

interface CreateDealUseCaseResponse {
  deal: Deal;
}

export class CreateDealUseCase {
  constructor(
    private dealsRepository: DealsRepository,
    private pipelinesRepository: PipelinesRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
  ) {}

  async execute(
    request: CreateDealUseCaseRequest,
  ): Promise<CreateDealUseCaseResponse> {
    const { tenantId, title, pipelineId, stageId } = request;

    // Validate title
    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    // Validate pipeline exists
    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(pipelineId),
      tenantId,
    );
    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found');
    }

    // Validate stage exists
    const stage = await this.pipelineStagesRepository.findById(
      new UniqueEntityID(stageId),
    );
    if (!stage) {
      throw new ResourceNotFoundError('Stage not found');
    }

    // Validate stage belongs to pipeline
    if (!stage.pipelineId.equals(new UniqueEntityID(pipelineId))) {
      throw new BadRequestError('Stage does not belong to the specified pipeline');
    }

    const deal = await this.dealsRepository.create({
      tenantId,
      title: title.trim(),
      customerId: request.customerId,
      pipelineId,
      stageId,
      value: request.value,
      currency: request.currency,
      expectedCloseDate: request.expectedCloseDate,
      probability: request.probability,
      assignedToUserId: request.assignedToUserId,
      tags: request.tags,
      customFields: request.customFields,
      previousDealId: request.previousDealId,
    });

    return { deal };
  }
}
