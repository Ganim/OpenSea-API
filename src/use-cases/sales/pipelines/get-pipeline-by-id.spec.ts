import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { makePipeline } from '@/utils/tests/factories/sales/make-pipeline';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPipelineByIdUseCase } from './get-pipeline-by-id';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: GetPipelineByIdUseCase;

const TENANT_ID = 'tenant-1';

describe('GetPipelineByIdUseCase', () => {
  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new GetPipelineByIdUseCase(pipelinesRepository);
  });

  it('should get a pipeline by id', async () => {
    const pipeline = makePipeline({ name: 'Sales Pipeline' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: pipeline.id.toString(),
    });

    expect(result.pipeline.name).toBe('Sales Pipeline');
    expect(result.pipeline.id.equals(pipeline.id)).toBe(true);
  });

  it('should throw when pipeline is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
