import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePipelineUseCase } from './create-pipeline';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: CreatePipelineUseCase;

describe('Create Pipeline Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new CreatePipelineUseCase(pipelinesRepository);
  });

  it('should create a pipeline', async () => {
    const { pipeline } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Sales Pipeline',
    });

    expect(pipeline.id.toString()).toEqual(expect.any(String));
    expect(pipeline.name).toBe('Sales Pipeline');
    expect(pipeline.type).toBe('SALES');
    expect(pipelinesRepository.items).toHaveLength(1);
  });

  it('should not create a pipeline with empty name', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create a pipeline with invalid type', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, name: 'Test', type: 'INVALID' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create a pipeline with duplicate name', async () => {
    await sut.execute({ tenantId: TENANT_ID, name: 'Sales Pipeline' });

    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, name: 'Sales Pipeline' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
