import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

const ALL_STAGE_TYPES = [
  'OPEN', 'WON', 'LOST', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED',
  'PROCESSING', 'INVOICED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED',
];

interface CreatePipelineStageUseCaseRequest {
  tenantId: string;
  pipelineId: string;
  name: string;
  color?: string;
  icon?: string;
  position?: number;
  type?: string;
  probability?: number;
  autoActions?: Record<string, unknown>;
  rottenAfterDays?: number;
}

interface CreatePipelineStageUseCaseResponse {
  stage: PipelineStage;
}

export class CreatePipelineStageUseCase {
  constructor(
    private pipelineStagesRepository: PipelineStagesRepository,
    private pipelinesRepository: PipelinesRepository,
  ) {}

  async execute(
    request: CreatePipelineStageUseCaseRequest,
  ): Promise<CreatePipelineStageUseCaseResponse> {
    const { tenantId, pipelineId, name, color, icon, position, type, probability, autoActions, rottenAfterDays } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(pipelineId),
      tenantId,
    );

    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found');
    }

    const finalType = type ?? 'OPEN';

    if (!ALL_STAGE_TYPES.includes(finalType)) {
      throw new BadRequestError(
        `Invalid stage type. Must be one of: ${ALL_STAGE_TYPES.join(', ')}`,
      );
    }

    const stage = PipelineStage.create({
      pipelineId: new UniqueEntityID(pipelineId),
      name,
      color,
      icon,
      position,
      type: finalType,
      probability,
      autoActions,
      rottenAfterDays,
    });

    await this.pipelineStagesRepository.create(stage);

    return { stage };
  }
}
