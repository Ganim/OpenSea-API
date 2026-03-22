import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelineStage } from '@/entities/sales/pipeline-stage';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

const ALL_STAGE_TYPES = [
  'OPEN',
  'WON',
  'LOST',
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PROCESSING',
  'INVOICED',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

interface UpdatePipelineStageUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  color?: string;
  icon?: string;
  position?: number;
  type?: string;
  probability?: number;
  autoActions?: Record<string, unknown>;
  rottenAfterDays?: number;
}

interface UpdatePipelineStageUseCaseResponse {
  stage: PipelineStage;
}

export class UpdatePipelineStageUseCase {
  constructor(
    private pipelineStagesRepository: PipelineStagesRepository,
    private pipelinesRepository: PipelinesRepository,
  ) {}

  async execute(
    request: UpdatePipelineStageUseCaseRequest,
  ): Promise<UpdatePipelineStageUseCaseResponse> {
    const {
      id,
      name,
      color,
      icon,
      position,
      type,
      probability,
      autoActions,
      rottenAfterDays,
    } = request;

    const stage = await this.pipelineStagesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!stage) {
      throw new ResourceNotFoundError('Pipeline stage not found');
    }

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Name is required');
      }
      stage.name = name;
    }

    if (type !== undefined) {
      if (!ALL_STAGE_TYPES.includes(type)) {
        throw new BadRequestError(
          `Invalid stage type. Must be one of: ${ALL_STAGE_TYPES.join(', ')}`,
        );
      }
      stage.type = type;
    }

    if (color !== undefined) stage.color = color;
    if (icon !== undefined) stage.icon = icon;
    if (position !== undefined) stage.position = position;
    if (probability !== undefined) stage.probability = probability;
    if (autoActions !== undefined) stage.autoActions = autoActions;
    if (rottenAfterDays !== undefined) stage.rottenAfterDays = rottenAfterDays;

    await this.pipelineStagesRepository.save(stage);

    return { stage };
  }
}
