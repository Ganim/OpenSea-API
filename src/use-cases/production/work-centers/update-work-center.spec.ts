import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkCenterUseCase } from './create-work-center';
import { UpdateWorkCenterUseCase } from './update-work-center';

let workCentersRepository: InMemoryWorkCentersRepository;
let createWorkCenterUseCase: CreateWorkCenterUseCase;
let sut: UpdateWorkCenterUseCase;

describe('Update Work Center Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workCentersRepository = new InMemoryWorkCentersRepository();
    createWorkCenterUseCase = new CreateWorkCenterUseCase(
      workCentersRepository,
    );
    sut = new UpdateWorkCenterUseCase(workCentersRepository);
  });

  // OBJECTIVE

  it('should update a work center name', async () => {
    const { workCenter: created } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'Assembly Area v2',
    });

    expect(workCenter.name).toBe('Assembly Area v2');
  });

  it('should update a work center code', async () => {
    const { workCenter: created } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      code: 'WC-001-NEW',
    });

    expect(workCenter.code).toBe('WC-001-NEW');
  });

  it('should update description', async () => {
    const { workCenter: created } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      description: 'Updated description',
    });

    expect(workCenter.description).toBe('Updated description');
  });

  it('should clear description with null', async () => {
    const { workCenter: created } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
      description: 'Some description',
    });

    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      description: null,
    });

    expect(workCenter.description).toBeNull();
  });

  it('should deactivate a work center', async () => {
    const { workCenter: created } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      isActive: false,
    });

    expect(workCenter.isActive).toBe(false);
  });

  // REJECTS

  it('should not update a non-existent work center', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow duplicate code on update', async () => {
    await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const { workCenter: second } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-002',
      name: 'Painting Area',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: second.id.toString(),
        code: 'WC-001',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow keeping the same code on update', async () => {
    const { workCenter: created } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      code: 'WC-001',
      name: 'Updated Name',
    });

    expect(workCenter.code).toBe('WC-001');
    expect(workCenter.name).toBe('Updated Name');
  });
});
