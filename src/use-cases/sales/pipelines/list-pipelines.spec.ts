import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPipelinesUseCase } from './list-pipelines';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: ListPipelinesUseCase;

describe('List Pipelines Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new ListPipelinesUseCase(pipelinesRepository);
  });

  it('should list pipelines for a tenant', async () => {
    for (let i = 0; i < 3; i++) {
      pipelinesRepository.items.push(
        Pipeline.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          name: `Pipeline ${i}`,
          type: 'SALES',
          isDefault: false,
        }),
      );
    }

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.pipelines).toHaveLength(3);
  });

  it('should return empty list when no pipelines', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.pipelines).toHaveLength(0);
  });
});
