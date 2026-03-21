import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { makePipeline } from '@/utils/tests/factories/sales/make-pipeline';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePipelineUseCase } from './update-pipeline';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: UpdatePipelineUseCase;

const TENANT_ID = 'tenant-1';

describe('UpdatePipelineUseCase', () => {
  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new UpdatePipelineUseCase(pipelinesRepository);
  });

  it('should update a pipeline name', async () => {
    const pipeline = makePipeline({ name: 'Sales Pipeline' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: pipeline.id.toString(),
      name: 'Updated Pipeline',
    });

    expect(result.pipeline.name).toBe('Updated Pipeline');
  });

  it('should update a pipeline position', async () => {
    const pipeline = makePipeline({ name: 'Sales Pipeline', position: 0 });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: pipeline.id.toString(),
      position: 5,
    });

    expect(result.pipeline.position).toBe(5);
  });

  it('should update pipeline isActive', async () => {
    const pipeline = makePipeline({ name: 'Sales Pipeline' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: pipeline.id.toString(),
      isActive: false,
    });

    expect(result.pipeline.isActive).toBe(false);
  });

  it('should throw when pipeline is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update to empty name', async () => {
    const pipeline = makePipeline({ name: 'Sales Pipeline' });
    await pipelinesRepository.create(pipeline);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: pipeline.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update to duplicate name in same tenant', async () => {
    const pipeline1 = makePipeline({ name: 'Pipeline 1' });
    const pipeline2 = makePipeline({ name: 'Pipeline 2' });
    await pipelinesRepository.create(pipeline1);
    await pipelinesRepository.create(pipeline2);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: pipeline2.id.toString(),
        name: 'Pipeline 1',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
