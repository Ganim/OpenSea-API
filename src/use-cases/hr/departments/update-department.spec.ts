import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';
import { UpdateDepartmentUseCase } from './update-department';

const TENANT_ID = 'tenant-1';

let departmentsRepository: InMemoryDepartmentsRepository;
let createDepartmentUseCase: CreateDepartmentUseCase;
let sut: UpdateDepartmentUseCase;

const companyId = new UniqueEntityID().toString();
const anotherCompanyId = new UniqueEntityID().toString();

describe('Update Department Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentsRepository,
    );
    sut = new UpdateDepartmentUseCase(departmentsRepository);
  });

  it('should update department successfully', async () => {
    const createResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: createResult.department.id.toString(),
      name: 'Software Engineering',
      description: 'Updated description',
    });

    expect(result.department.name).toBe('Software Engineering');
    expect(result.department.description).toBe('Updated description');
  });

  it('should not update non-existent department', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow('Department not found');
  });

  it('should not update code to existing code in the same company', async () => {
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    const result2 = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Sales',
      code: 'SALES',
      companyId,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: result2.department.id.toString(),
        code: 'ENG',
      }),
    ).rejects.toThrow('Department with this code already exists');
  });

  it('should update code if same department', async () => {
    const createResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: createResult.department.id.toString(),
      code: 'ENG', // Same code
      name: 'Updated Name',
    });

    expect(result.department.code).toBe('ENG');
    expect(result.department.name).toBe('Updated Name');
  });

  it('should not set department as its own parent', async () => {
    const createResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: createResult.department.id.toString(),
        parentId: createResult.department.id.toString(),
      }),
    ).rejects.toThrow('Department cannot be its own parent');
  });

  it('should not set non-existent parent', async () => {
    const createResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: createResult.department.id.toString(),
        parentId: 'non-existent-id',
      }),
    ).rejects.toThrow('Parent department not found');
  });

  it('should not set parent from different company', async () => {
    const parentResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Technology',
      code: 'TECH',
      companyId: anotherCompanyId,
    });

    const childResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: childResult.department.id.toString(),
        parentId: parentResult.department.id.toString(),
      }),
    ).rejects.toThrow('Parent department must belong to the same company');
  });

  it('should remove parent by setting null', async () => {
    const parentResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Technology',
      code: 'TECH',
      companyId,
    });

    const childResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      parentId: parentResult.department.id.toString(),
      companyId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: childResult.department.id.toString(),
      parentId: null,
    });

    expect(result.department.parentId).toBeUndefined();
  });

  it('should update isActive status', async () => {
    const createResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      isActive: true,
      companyId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: createResult.department.id.toString(),
      isActive: false,
    });

    expect(result.department.isActive).toBe(false);
  });

  it('should not set child as parent (circular reference)', async () => {
    const parentResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Technology',
      code: 'TECH',
      companyId,
    });

    const childResult = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      parentId: parentResult.department.id.toString(),
      companyId,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: parentResult.department.id.toString(),
        parentId: childResult.department.id.toString(),
      }),
    ).rejects.toThrow('Cannot set a child department as parent');
  });
});
