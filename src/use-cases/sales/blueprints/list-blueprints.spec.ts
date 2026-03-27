import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import { InMemoryProcessBlueprintsRepository } from '@/repositories/sales/in-memory/in-memory-process-blueprints-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBlueprintsUseCase } from './list-blueprints';

let blueprintsRepository: InMemoryProcessBlueprintsRepository;
let sut: ListBlueprintsUseCase;

const TENANT_ID = 'tenant-1';
const PIPELINE_ID = new UniqueEntityID().toString();

describe('List Blueprints Use Case', () => {
  beforeEach(() => {
    blueprintsRepository = new InMemoryProcessBlueprintsRepository();
    sut = new ListBlueprintsUseCase(blueprintsRepository);
  });

  it('should list blueprints with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await blueprintsRepository.create(
        ProcessBlueprint.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          name: `Blueprint ${i}`,
          pipelineId: new UniqueEntityID(PIPELINE_ID),
        }),
      );
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 3,
    });

    expect(result.blueprints).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should filter blueprints by pipelineId', async () => {
    const otherPipelineId = new UniqueEntityID().toString();

    await blueprintsRepository.create(
      ProcessBlueprint.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Pipeline A Blueprint',
        pipelineId: new UniqueEntityID(PIPELINE_ID),
      }),
    );

    await blueprintsRepository.create(
      ProcessBlueprint.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Pipeline B Blueprint',
        pipelineId: new UniqueEntityID(otherPipelineId),
      }),
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      pipelineId: PIPELINE_ID,
    });

    expect(result.blueprints).toHaveLength(1);
    expect(result.blueprints[0].name).toBe('Pipeline A Blueprint');
  });

  it('should filter blueprints by search', async () => {
    await blueprintsRepository.create(
      ProcessBlueprint.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Sales Approval',
        pipelineId: new UniqueEntityID(PIPELINE_ID),
      }),
    );

    await blueprintsRepository.create(
      ProcessBlueprint.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Support Flow',
        pipelineId: new UniqueEntityID(PIPELINE_ID),
      }),
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      search: 'approval',
    });

    expect(result.blueprints).toHaveLength(1);
    expect(result.blueprints[0].name).toBe('Sales Approval');
  });
});
