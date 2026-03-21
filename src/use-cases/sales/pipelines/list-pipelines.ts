import type { Pipeline } from '@/entities/sales/pipeline';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

interface ListPipelinesUseCaseRequest {
  tenantId: string;
  onlyActive?: boolean;
}

interface ListPipelinesUseCaseResponse {
  pipelines: Pipeline[];
}

export class ListPipelinesUseCase {
  constructor(private pipelinesRepository: PipelinesRepository) {}

  async execute(
    request: ListPipelinesUseCaseRequest,
  ): Promise<ListPipelinesUseCaseResponse> {
    const { tenantId, onlyActive } = request;

    let pipelines = await this.pipelinesRepository.findMany(tenantId);

    if (onlyActive) {
      pipelines = pipelines.filter((p) => p.isActive);
    }

    return { pipelines };
  }
}
