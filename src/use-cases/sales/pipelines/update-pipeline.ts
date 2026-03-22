import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Pipeline } from '@/entities/sales/pipeline';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

interface UpdatePipelineUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  position?: number;
  isActive?: boolean;
  nextPipelineId?: string | null;
}

interface UpdatePipelineUseCaseResponse {
  pipeline: Pipeline;
}

export class UpdatePipelineUseCase {
  constructor(private pipelinesRepository: PipelinesRepository) {}

  async execute(
    request: UpdatePipelineUseCaseRequest,
  ): Promise<UpdatePipelineUseCaseResponse> {
    const {
      tenantId,
      id,
      name,
      description,
      icon,
      color,
      isDefault,
      position,
      isActive,
      nextPipelineId,
    } = request;

    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found');
    }

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Name is required');
      }
      if (name !== pipeline.name) {
        const existingPipeline = await this.pipelinesRepository.findByName(
          name,
          tenantId,
        );
        if (existingPipeline && !existingPipeline.id.equals(pipeline.id)) {
          throw new BadRequestError('Pipeline with this name already exists');
        }
      }
      pipeline.name = name;
    }

    if (description !== undefined) pipeline.description = description;
    if (icon !== undefined) pipeline.icon = icon;
    if (color !== undefined) pipeline.color = color;
    if (isDefault !== undefined) pipeline.isDefault = isDefault;
    if (position !== undefined) pipeline.position = position;
    if (isActive !== undefined) pipeline.isActive = isActive;
    if (nextPipelineId !== undefined) {
      pipeline.nextPipelineId = nextPipelineId
        ? new UniqueEntityID(nextPipelineId)
        : undefined;
    }

    await this.pipelinesRepository.save(pipeline);

    return { pipeline };
  }
}
