import { describe, it, expect, beforeEach } from 'vitest';
import { ListBoardsUseCase } from './list-boards';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';

let boardsRepository: InMemoryBoardsRepository;
let sut: ListBoardsUseCase;

describe('ListBoardsUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    sut = new ListBoardsUseCase(boardsRepository);
  });

  it('should list personal boards', async () => {
    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Personal Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    const { boards } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(boards).toHaveLength(1);
    expect(boards[0].title).toBe('Personal Board');
  });

  it('should list team boards', async () => {
    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Team Board',
      ownerId: 'user-1',
      type: 'TEAM',
      teamId: 'team-1',
    });

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Personal Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    const { boards } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      type: 'TEAM',
    });

    expect(boards).toHaveLength(1);
    expect(boards[0].title).toBe('Team Board');
  });

  it('should filter by type', async () => {
    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Personal 1',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Team 1',
      ownerId: 'user-1',
      type: 'TEAM',
      teamId: 'team-1',
    });

    const { boards, meta } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      type: 'PERSONAL',
    });

    expect(boards).toHaveLength(1);
    expect(boards[0].type).toBe('PERSONAL');
    expect(meta.total).toBe(1);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await boardsRepository.create({
        tenantId: 'tenant-1',
        title: `Board ${i}`,
        ownerId: 'user-1',
        position: i,
      });
    }

    const { boards, meta } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      page: 1,
      limit: 2,
    });

    expect(boards).toHaveLength(2);
    expect(meta.total).toBe(5);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(2);
    expect(meta.pages).toBe(3);
  });

  it('should exclude deleted boards', async () => {
    const boardToDelete = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Deleted Board',
      ownerId: 'user-1',
    });

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Active Board',
      ownerId: 'user-1',
    });

    await boardsRepository.softDelete(boardToDelete.id.toString(), 'tenant-1');

    const { boards } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(boards).toHaveLength(1);
    expect(boards[0].title).toBe('Active Board');
  });
});
