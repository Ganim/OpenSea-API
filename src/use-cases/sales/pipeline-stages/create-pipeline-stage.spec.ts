import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePipelineStageUseCase } from './create-pipeline-stage';

let stagesRepository: InMemoryPipelineStagesRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let sut: CreatePipelineStageUseCase;

describe('Create Pipeline Stage Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let pipelineId: string;

  beforeEach(() => {
    stagesRepository = new InMemoryPipelineStagesRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new CreatePipelineStageUseCase(stagesRepository, pipelinesRepository);

    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales Pipeline',
      type: 'SALES',
      isDefault: false,
    });
    pipelinesRepository.items.push(pipeline);
    pipelineId = pipeline.id.toString();
  });

  it('should create a pipeline stage', async () => {
    const { stage } = await sut.execute({
      tenantId: TENANT_ID,
      pipelineId,
      name: 'Qualification',
    });

    expect(stage.id.toString()).toEqual(expect.any(String));
    expect(stage.name).toBe('Qualification');
    expect(stage.type).toBe('OPEN');
    expect(stagesRepository.items).toHaveLength(1);
  });

  it('should not create a stage with empty name', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, pipelineId, name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create a stage for non-existent pipeline', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, pipelineId: 'non-existent', name: 'Test' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject invalid stage type', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, pipelineId, name: 'Test', type: 'INVALID' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
