import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { InMemoryOperationRoutingsRepository } from '@/repositories/production/in-memory/in-memory-operation-routings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateOperationRoutingUseCase } from './create-operation-routing';
import { UpdateOperationRoutingUseCase } from './update-operation-routing';

let operationRoutingsRepository: InMemoryOperationRoutingsRepository;
let bomsRepository: InMemoryBomsRepository;
let createRouting: CreateOperationRoutingUseCase;
let sut: UpdateOperationRoutingUseCase;

describe('UpdateOperationRoutingUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    operationRoutingsRepository = new InMemoryOperationRoutingsRepository();
    bomsRepository = new InMemoryBomsRepository();
    createRouting = new CreateOperationRoutingUseCase(
      operationRoutingsRepository,
      bomsRepository,
    );
    sut = new UpdateOperationRoutingUseCase(operationRoutingsRepository);

    const bom = await bomsRepository.create({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: 1,
      name: 'Test BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });
    bomId = bom.id.toString();
  });

  it('should update an operation routing', async () => {
    const { operationRouting: created } = await createRouting.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Cutting',
      setupTime: 15,
      executionTime: 30,
      waitTime: 5,
      moveTime: 10,
    });

    const { operationRouting } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      operationName: 'Precision Cutting',
      executionTime: 45,
    });

    expect(operationRouting.operationName).toBe('Precision Cutting');
    expect(operationRouting.executionTime).toBe(45);
    expect(operationRouting.setupTime).toBe(15);
  });

  it('should update nullable fields to null', async () => {
    const { operationRouting: created } = await createRouting.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Inspection',
      description: 'Quality check',
      setupTime: 5,
      executionTime: 20,
      waitTime: 0,
      moveTime: 0,
      skillRequired: 'Inspector',
    });

    const { operationRouting } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      description: null,
      skillRequired: null,
    });

    expect(operationRouting.description).toBeNull();
    expect(operationRouting.skillRequired).toBeNull();
  });

  it('should throw if operation routing not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        operationName: 'New Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
