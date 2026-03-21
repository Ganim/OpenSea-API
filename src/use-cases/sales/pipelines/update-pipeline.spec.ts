import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePipelineUseCase } from './update-pipeline';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: UpdatePipelineUseCase;

describe('Update Pipeline Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new UpdatePipelineUseCase(pipelinesRepository);
  });

  it('should update a pipeline name', async () => {
    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Old Name',
      type: 'SALES',
      isDefault: false,
    });
    pipelinesRepository.items.push(pipeline);

    const result = await sut.execute({
      id: pipeline.id.toString(),
      tenantId: TENANT_ID,
      name: 'New Name',
    });

    expect(result.pipeline.name).toBe('New Name');
  });

  it('should throw if pipeline not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID, name: 'Test' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not update with empty name', async () => {
    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Pipeline',
      type: 'SALES',
      isDefault: false,
    });
    pipelinesRepository.items.push(pipeline);

    await expect(() =>
      sut.execute({
        id: pipeline.id.toString(),
        tenantId: TENANT_ID,
        name: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
