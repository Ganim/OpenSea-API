import { InMemoryPositionsRepository } from '@/repositories/hr/in-memory/in-memory-positions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePositionUseCase } from './create-position';
import { ListPositionsUseCase } from './list-positions';

let positionsRepository: InMemoryPositionsRepository;
let createPositionUseCase: CreatePositionUseCase;
let sut: ListPositionsUseCase;

describe('List Positions Use Case', () => {
  beforeEach(() => {
    positionsRepository = new InMemoryPositionsRepository();
    createPositionUseCase = new CreatePositionUseCase(positionsRepository);
    sut = new ListPositionsUseCase(positionsRepository);
  });

  it('should list positions with pagination', async () => {
    await createPositionUseCase.execute({ name: 'Engineer', code: 'ENG' });
    await createPositionUseCase.execute({ name: 'Manager', code: 'MGR' });
    await createPositionUseCase.execute({ name: 'Director', code: 'DIR' });

    const result = await sut.execute({ page: 1, perPage: 2 });

    expect(result.positions).toHaveLength(2);
    expect(result.meta.total).toBe(3);
    expect(result.meta.page).toBe(1);
    expect(result.meta.perPage).toBe(2);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should filter by search term', async () => {
    await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
    });
    await createPositionUseCase.execute({ name: 'Manager', code: 'MGR' });

    const result = await sut.execute({ search: 'eng' });

    expect(result.positions).toHaveLength(1);
    expect(result.positions[0].name).toBe('Software Engineer');
  });

  it('should filter by isActive', async () => {
    await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
      isActive: true,
    });
    await createPositionUseCase.execute({
      name: 'Old Position',
      code: 'OLD',
      isActive: false,
    });

    const result = await sut.execute({ isActive: true });

    expect(result.positions).toHaveLength(1);
    expect(result.positions[0].name).toBe('Software Engineer');
  });

  it('should filter by departmentId', async () => {
    await createPositionUseCase.execute({
      name: 'Software Engineer',
      code: 'SE',
      departmentId: 'dept-123',
    });

    await createPositionUseCase.execute({
      name: 'Manager',
      code: 'MGR',
      departmentId: 'dept-456',
    });

    const result = await sut.execute({ departmentId: 'dept-123' });

    expect(result.positions).toHaveLength(1);
    expect(result.positions[0].name).toBe('Software Engineer');
  });

  it('should filter by level', async () => {
    await createPositionUseCase.execute({
      name: 'Junior Engineer',
      code: 'JE',
      level: 1,
    });

    await createPositionUseCase.execute({
      name: 'Senior Engineer',
      code: 'SE',
      level: 3,
    });

    const result = await sut.execute({ level: 3 });

    expect(result.positions).toHaveLength(1);
    expect(result.positions[0].name).toBe('Senior Engineer');
  });

  it('should return empty list when no positions exist', async () => {
    const result = await sut.execute({});

    expect(result.positions).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('should use default pagination values', async () => {
    await createPositionUseCase.execute({ name: 'Engineer', code: 'ENG' });

    const result = await sut.execute({});

    expect(result.meta.page).toBe(1);
    expect(result.meta.perPage).toBe(20);
  });
});
