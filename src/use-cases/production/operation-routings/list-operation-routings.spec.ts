import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { InMemoryOperationRoutingsRepository } from '@/repositories/production/in-memory/in-memory-operation-routings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateOperationRoutingUseCase } from './create-operation-routing';
import { ListOperationRoutingsUseCase } from './list-operation-routings';

let operationRoutingsRepository: InMemoryOperationRoutingsRepository;
let bomsRepository: InMemoryBomsRepository;
let createRouting: CreateOperationRoutingUseCase;
let sut: ListOperationRoutingsUseCase;

describe('ListOperationRoutingsUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    operationRoutingsRepository = new InMemoryOperationRoutingsRepository();
    bomsRepository = new InMemoryBomsRepository();
    createRouting = new CreateOperationRoutingUseCase(
      operationRoutingsRepository,
      bomsRepository,
    );
    sut = new ListOperationRoutingsUseCase(operationRoutingsRepository);

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

  it('should list operation routings by bomId', async () => {
    await createRouting.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Cutting',
      setupTime: 15,
      executionTime: 30,
      waitTime: 5,
      moveTime: 10,
    });

    await createRouting.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 2,
      operationName: 'Assembly',
      setupTime: 10,
      executionTime: 45,
      waitTime: 5,
      moveTime: 5,
    });

    const { operationRoutings } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
    });

    expect(operationRoutings).toHaveLength(2);
  });

  it('should return empty array when no routings exist', async () => {
    const { operationRoutings } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
    });

    expect(operationRoutings).toHaveLength(0);
  });

  it('should not return routings from other BOMs', async () => {
    const otherBom = await bomsRepository.create({
      tenantId: TENANT_ID,
      productId: 'product-2',
      version: 1,
      name: 'Other BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    await createRouting.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Cutting',
      setupTime: 15,
      executionTime: 30,
      waitTime: 5,
      moveTime: 10,
    });

    await createRouting.execute({
      tenantId: TENANT_ID,
      bomId: otherBom.id.toString(),
      sequence: 1,
      operationName: 'Welding',
      setupTime: 10,
      executionTime: 20,
      waitTime: 5,
      moveTime: 5,
    });

    const { operationRoutings } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
    });

    expect(operationRoutings).toHaveLength(1);
    expect(operationRoutings[0].operationName).toBe('Cutting');
  });
});
