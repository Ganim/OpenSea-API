import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkCenterUseCase } from './create-work-center';

let workCentersRepository: InMemoryWorkCentersRepository;
let sut: CreateWorkCenterUseCase;

describe('Create Work Center Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workCentersRepository = new InMemoryWorkCentersRepository();
    sut = new CreateWorkCenterUseCase(workCentersRepository);
  });

  // OBJECTIVE

  it('should create a work center', async () => {
    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    expect(workCenter.id.toString()).toEqual(expect.any(String));
    expect(workCenter.code).toBe('WC-001');
    expect(workCenter.name).toBe('Assembly Area');
    expect(workCenter.isActive).toBe(true);
  });

  it('should create a work center with description', async () => {
    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'WC-002',
      name: 'Painting Area',
      description: 'Area for painting and finishing',
    });

    expect(workCenter.description).toBe('Area for painting and finishing');
  });

  it('should create an inactive work center', async () => {
    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'WC-003',
      name: 'Deprecated Area',
      isActive: false,
    });

    expect(workCenter.isActive).toBe(false);
  });

  it('should create a work center without optional fields', async () => {
    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'WC-004',
      name: 'Basic Area',
    });

    expect(workCenter.description).toBeNull();
    expect(workCenter.isActive).toBe(true);
  });

  // REJECTS

  it('should not allow creating a work center with duplicate code', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'WC-001',
        name: 'Different Name',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // ISOLATION

  it('should allow same code in different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      code: 'WC-001',
      name: 'Assembly Area T1',
    });

    const { workCenter } = await sut.execute({
      tenantId: 'tenant-2',
      code: 'WC-001',
      name: 'Assembly Area T2',
    });

    expect(workCenter.code).toBe('WC-001');
  });
});
