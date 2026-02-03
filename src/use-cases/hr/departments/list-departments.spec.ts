import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';
import { ListDepartmentsUseCase } from './list-departments';

const TENANT_ID = 'tenant-1';

let departmentsRepository: InMemoryDepartmentsRepository;
let createDepartmentUseCase: CreateDepartmentUseCase;
let sut: ListDepartmentsUseCase;

const companyId = new UniqueEntityID().toString();
const anotherCompanyId = new UniqueEntityID().toString();

describe('List Departments Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentsRepository,
    );
    sut = new ListDepartmentsUseCase(departmentsRepository);
  });

  it('should list departments with pagination', async () => {
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Sales',
      code: 'SALES',
      companyId,
    });
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Marketing',
      code: 'MKT',
      companyId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 2,
    });

    expect(result.departments).toHaveLength(2);
    expect(result.meta.total).toBe(3);
    expect(result.meta.page).toBe(1);
    expect(result.meta.perPage).toBe(2);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should filter by search term', async () => {
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Sales',
      code: 'SALES',
      companyId,
    });

    const result = await sut.execute({ tenantId: TENANT_ID, search: 'eng' });

    expect(result.departments).toHaveLength(1);
    expect(result.departments[0].name).toBe('Engineering');
  });

  it('should filter by isActive', async () => {
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      isActive: true,
      companyId,
    });
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Old Dept',
      code: 'OLD',
      isActive: false,
      companyId,
    });

    const result = await sut.execute({ tenantId: TENANT_ID, isActive: true });

    expect(result.departments).toHaveLength(1);
    expect(result.departments[0].name).toBe('Engineering');
  });

  it('should filter by parentId', async () => {
    const parent = await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Technology',
      code: 'TECH',
      companyId,
    });

    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      parentId: parent.department.id.toString(),
      companyId,
    });

    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Sales',
      code: 'SALES',
      companyId,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      parentId: parent.department.id.toString(),
    });

    expect(result.departments).toHaveLength(1);
    expect(result.departments[0].name).toBe('Engineering');
  });

  it('should filter by companyId', async () => {
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Sales',
      code: 'SALES',
      companyId: anotherCompanyId,
    });

    const result = await sut.execute({ tenantId: TENANT_ID, companyId });

    expect(result.departments).toHaveLength(1);
    expect(result.departments[0].name).toBe('Engineering');
    expect(result.departments[0].companyId.toString()).toBe(companyId);
  });

  it('should return empty list when no departments exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.departments).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('should use default pagination values', async () => {
    await createDepartmentUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Engineering',
      code: 'ENG',
      companyId,
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.meta.page).toBe(1);
    expect(result.meta.perPage).toBe(20);
  });
});
