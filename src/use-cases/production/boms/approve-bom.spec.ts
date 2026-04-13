import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApproveBomUseCase } from './approve-bom';
import { CreateBomUseCase } from './create-bom';

let bomsRepository: InMemoryBomsRepository;
let createBom: CreateBomUseCase;
let sut: ApproveBomUseCase;

describe('ApproveBomUseCase', () => {
  const TENANT_ID = 'tenant-1';
  const APPROVER_ID = 'approver-1';

  beforeEach(() => {
    bomsRepository = new InMemoryBomsRepository();
    createBom = new CreateBomUseCase(bomsRepository);
    sut = new ApproveBomUseCase(bomsRepository);
  });

  it('should approve a DRAFT BOM', async () => {
    const { bom: created } = await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: 1,
      name: 'Draft BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    expect(created.status).toBe('DRAFT');

    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      approvedById: APPROVER_ID,
    });

    expect(bom.status).toBe('ACTIVE');
    expect(bom.approvedById?.toString()).toBe(APPROVER_ID);
    expect(bom.approvedAt).toBeInstanceOf(Date);
  });

  it('should not approve a BOM that is already ACTIVE', async () => {
    const { bom: created } = await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: 1,
      name: 'Draft BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      approvedById: APPROVER_ID,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: created.id.toString(),
        approvedById: APPROVER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if BOM not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        approvedById: APPROVER_ID,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
