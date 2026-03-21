import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { makePipeline } from '@/utils/tests/factories/sales/make-pipeline';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPipelinesUseCase } from './list-pipelines';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: ListPipelinesUseCase;

const TENANT_ID = 'tenant-1';

describe('ListPipelinesUseCase', () => {
  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new ListPipelinesUseCase(pipelinesRepository);
  });

  it('should list all pipelines for a tenant', async () => {
    const pipeline1 = makePipeline({ name: 'Sales Pipeline' });
    const pipeline2 = makePipeline({ name: 'Support Pipeline', type: 'SUPPORT' });
    await pipelinesRepository.create(pipeline1);
    await pipelinesRepository.create(pipeline2);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.pipelines).toHaveLength(2);
  });

  it('should list only active pipelines when onlyActive is true', async () => {
    const activePipeline = makePipeline({ name: 'Active Pipeline' });
    const inactivePipeline = makePipeline({
      name: 'Inactive Pipeline',
      isActive: false,
    });
    await pipelinesRepository.create(activePipeline);
    await pipelinesRepository.create(inactivePipeline);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      onlyActive: true,
    });

    expect(result.pipelines).toHaveLength(1);
    expect(result.pipelines[0].name).toBe('Active Pipeline');
  });

  it('should return empty array when no pipelines exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.pipelines).toHaveLength(0);
  });

  it('should not return pipelines from other tenants', async () => {
    const pipeline = makePipeline({ name: 'Other Tenant Pipeline' });
    await pipelinesRepository.create(pipeline);

    const result = await sut.execute({ tenantId: 'other-tenant' });

    expect(result.pipelines).toHaveLength(0);
  });
});
