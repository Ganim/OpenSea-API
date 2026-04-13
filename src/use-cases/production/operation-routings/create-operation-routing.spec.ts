import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { InMemoryOperationRoutingsRepository } from '@/repositories/production/in-memory/in-memory-operation-routings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateOperationRoutingUseCase } from './create-operation-routing';

let operationRoutingsRepository: InMemoryOperationRoutingsRepository;
let bomsRepository: InMemoryBomsRepository;
let sut: CreateOperationRoutingUseCase;

describe('CreateOperationRoutingUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    operationRoutingsRepository = new InMemoryOperationRoutingsRepository();
    bomsRepository = new InMemoryBomsRepository();
    sut = new CreateOperationRoutingUseCase(
      operationRoutingsRepository,
      bomsRepository,
    );

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

  it('should create an operation routing', async () => {
    const { operationRouting } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Cutting',
      setupTime: 15,
      executionTime: 30,
      waitTime: 5,
      moveTime: 10,
    });

    expect(operationRouting.id.toString()).toEqual(expect.any(String));
    expect(operationRouting.operationName).toBe('Cutting');
    expect(operationRouting.sequence).toBe(1);
    expect(operationRouting.totalTime).toBe(60);
  });

  it('should create with optional fields', async () => {
    const { operationRouting } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Quality Inspection',
      description: 'Visual inspection step',
      setupTime: 5,
      executionTime: 20,
      waitTime: 0,
      moveTime: 0,
      isQualityCheck: true,
      isOptional: false,
      skillRequired: 'Quality Inspector',
      instructions: 'Check for defects',
      workstationId: 'ws-1',
    });

    expect(operationRouting.isQualityCheck).toBe(true);
    expect(operationRouting.skillRequired).toBe('Quality Inspector');
    expect(operationRouting.description).toBe('Visual inspection step');
  });

  it('should not allow duplicate [bomId, sequence]', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      sequence: 1,
      operationName: 'Cutting',
      setupTime: 15,
      executionTime: 30,
      waitTime: 5,
      moveTime: 10,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bomId,
        sequence: 1,
        operationName: 'Assembly',
        setupTime: 10,
        executionTime: 20,
        waitTime: 5,
        moveTime: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow same sequence for different BOMs', async () => {
    const otherBom = await bomsRepository.create({
      tenantId: TENANT_ID,
      productId: 'product-2',
      version: 1,
      name: 'Other BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    await sut.execute({
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
      bomId: otherBom.id.toString(),
      sequence: 1,
      operationName: 'Assembly',
      setupTime: 10,
      executionTime: 20,
      waitTime: 5,
      moveTime: 5,
    });

    expect(operationRouting.id.toString()).toEqual(expect.any(String));
  });

  it('should throw if BOM not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bomId: 'non-existent-bom',
        sequence: 1,
        operationName: 'Cutting',
        setupTime: 15,
        executionTime: 30,
        waitTime: 5,
        moveTime: 10,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
