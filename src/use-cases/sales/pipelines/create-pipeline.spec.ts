import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePipelineUseCase } from './create-pipeline';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: CreatePipelineUseCase;

const TENANT_ID = 'tenant-1';

describe('CreatePipelineUseCase', () => {
  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new CreatePipelineUseCase(pipelinesRepository);
  });

  it('should create a pipeline', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Sales Pipeline',
      description: 'Main sales pipeline',
      type: 'SALES',
    });

    expect(result.pipeline.name).toBe('Sales Pipeline');
    expect(result.pipeline.description).toBe('Main sales pipeline');
    expect(result.pipeline.type).toBe('SALES');
    expect(result.pipeline.isDefault).toBe(false);
    expect(result.pipeline.isActive).toBe(true);
    expect(result.pipeline.id).toBeDefined();
    expect(result.pipeline.createdAt).toBeDefined();
  });

  it('should create a pipeline with default type SALES', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Default Pipeline',
    });

    expect(result.pipeline.type).toBe('SALES');
  });

  it('should not create a pipeline with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a pipeline with duplicate name in same tenant', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Sales Pipeline',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Sales Pipeline',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow same name in different tenants', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Sales Pipeline',
    });

    const result = await sut.execute({
      tenantId: 'tenant-2',
      name: 'Sales Pipeline',
    });

    expect(result.pipeline.name).toBe('Sales Pipeline');
  });

  it('should not create a pipeline with invalid type', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid Pipeline',
        type: 'INVALID_TYPE',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
