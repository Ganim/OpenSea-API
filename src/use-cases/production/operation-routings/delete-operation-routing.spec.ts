import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { InMemoryOperationRoutingsRepository } from '@/repositories/production/in-memory/in-memory-operation-routings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateOperationRoutingUseCase } from './create-operation-routing';
import { DeleteOperationRoutingUseCase } from './delete-operation-routing';

let operationRoutingsRepository: InMemoryOperationRoutingsRepository;
let bomsRepository: InMemoryBomsRepository;
let createRouting: CreateOperationRoutingUseCase;
let sut: DeleteOperationRoutingUseCase;

describe('DeleteOperationRoutingUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    operationRoutingsRepository = new InMemoryOperationRoutingsRepository();
    bomsRepository = new InMemoryBomsRepository();
    createRouting = new CreateOperationRoutingUseCase(
      operationRoutingsRepository,
      bomsRepository,
    );
    sut = new DeleteOperationRoutingUseCase(operationRoutingsRepository);

    const bom = await bomsRepository.create({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'Test BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });
    bomId = bom.id.toString();
  });

  it('should delete an operation routing', async () => {
    const { operationRouting } = await createRouting.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Cutting',
      setupTime: 15,
      executionTime: 30,
      waitTime: 5,
      moveTime: 10,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: operationRouting.id.toString(),
    });

    expect(result.message).toBe('Operation routing deleted successfully.');
    expect(operationRoutingsRepository.items).toHaveLength(0);
  });

  it('should throw if operation routing not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
