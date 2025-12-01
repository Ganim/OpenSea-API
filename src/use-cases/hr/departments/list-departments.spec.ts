import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDepartmentUseCase } from './create-department';
import { ListDepartmentsUseCase } from './list-departments';

let departmentsRepository: InMemoryDepartmentsRepository;
let createDepartmentUseCase: CreateDepartmentUseCase;
let sut: ListDepartmentsUseCase;

describe('List Departments Use Case', () => {
  beforeEach(() => {
    departmentsRepository = new InMemoryDepartmentsRepository();
    createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentsRepository,
    );
    sut = new ListDepartmentsUseCase(departmentsRepository);
  });

  it('should list departments with pagination', async () => {
    await createDepartmentUseCase.execute({ name: 'Engineering', code: 'ENG' });
    await createDepartmentUseCase.execute({ name: 'Sales', code: 'SALES' });
    await createDepartmentUseCase.execute({ name: 'Marketing', code: 'MKT' });

    const result = await sut.execute({ page: 1, perPage: 2 });

    expect(result.departments).toHaveLength(2);
    expect(result.meta.total).toBe(3);
    expect(result.meta.page).toBe(1);
    expect(result.meta.perPage).toBe(2);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should filter by search term', async () => {
    await createDepartmentUseCase.execute({ name: 'Engineering', code: 'ENG' });
    await createDepartmentUseCase.execute({ name: 'Sales', code: 'SALES' });

    const result = await sut.execute({ search: 'eng' });

    expect(result.departments).toHaveLength(1);
    expect(result.departments[0].name).toBe('Engineering');
  });

  it('should filter by isActive', async () => {
    await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      isActive: true,
    });
    await createDepartmentUseCase.execute({
      name: 'Old Dept',
      code: 'OLD',
      isActive: false,
    });

    const result = await sut.execute({ isActive: true });

    expect(result.departments).toHaveLength(1);
    expect(result.departments[0].name).toBe('Engineering');
  });

  it('should filter by parentId', async () => {
    const parent = await createDepartmentUseCase.execute({
      name: 'Technology',
      code: 'TECH',
    });

    await createDepartmentUseCase.execute({
      name: 'Engineering',
      code: 'ENG',
      parentId: parent.department.id.toString(),
    });

    await createDepartmentUseCase.execute({
      name: 'Sales',
      code: 'SALES',
    });

    const result = await sut.execute({
      parentId: parent.department.id.toString(),
    });

    expect(result.departments).toHaveLength(1);
    expect(result.departments[0].name).toBe('Engineering');
  });

  it('should return empty list when no departments exist', async () => {
    const result = await sut.execute({});

    expect(result.departments).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('should use default pagination values', async () => {
    await createDepartmentUseCase.execute({ name: 'Engineering', code: 'ENG' });

    const result = await sut.execute({});

    expect(result.meta.page).toBe(1);
    expect(result.meta.perPage).toBe(20);
  });
});
