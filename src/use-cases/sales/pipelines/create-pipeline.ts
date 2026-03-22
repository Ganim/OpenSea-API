import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

const VALID_PIPELINE_TYPES = [
  'SALES',
  'ONBOARDING',
  'SUPPORT',
  'CUSTOM',
  'ORDER_B2C',
  'ORDER_B2B',
  'ORDER_BID',
  'ORDER_ECOMMERCE',
];

interface CreatePipelineUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  type?: string;
  isDefault?: boolean;
  position?: number;
  nextPipelineId?: string;
}

interface CreatePipelineUseCaseResponse {
  pipeline: Pipeline;
}

export class CreatePipelineUseCase {
  constructor(private pipelinesRepository: PipelinesRepository) {}

  async execute(
    request: CreatePipelineUseCaseRequest,
  ): Promise<CreatePipelineUseCaseResponse> {
    const {
      tenantId,
      name,
      description,
      icon,
      color,
      type,
      isDefault,
      position,
      nextPipelineId,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    const finalType = type ?? 'SALES';
    if (!VALID_PIPELINE_TYPES.includes(finalType)) {
      throw new BadRequestError(
        `Invalid pipeline type. Must be one of: ${VALID_PIPELINE_TYPES.join(', ')}`,
      );
    }

    const existingPipeline = await this.pipelinesRepository.findByName(
      name,
      tenantId,
    );
    if (existingPipeline) {
      throw new BadRequestError('Pipeline with this name already exists');
    }

    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(tenantId),
      name,
      description,
      icon,
      color,
      type: finalType,
      isDefault: isDefault ?? false,
      position,
      nextPipelineId: nextPipelineId
        ? new UniqueEntityID(nextPipelineId)
        : undefined,
    });

    await this.pipelinesRepository.create(pipeline);

    return { pipeline };
  }
}
