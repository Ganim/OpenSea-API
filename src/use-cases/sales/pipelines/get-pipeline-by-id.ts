import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Pipeline } from '@/entities/sales/pipeline';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

interface GetPipelineByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetPipelineByIdUseCaseResponse {
  pipeline: Pipeline;
}

export class GetPipelineByIdUseCase {
  constructor(private pipelinesRepository: PipelinesRepository) {}

  async execute(
    request: GetPipelineByIdUseCaseRequest,
  ): Promise<GetPipelineByIdUseCaseResponse> {
    const { tenantId, id } = request;

    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found');
    }

    return { pipeline };
  }
}
