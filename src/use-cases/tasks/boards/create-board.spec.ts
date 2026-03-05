import { describe, it, expect, beforeEach } from 'vitest';
import { CreateBoardUseCase } from './create-board';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardColumnsRepository: InMemoryBoardColumnsRepository;
let sut: CreateBoardUseCase;

describe('CreateBoardUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    boardColumnsRepository = new InMemoryBoardColumnsRepository();
    sut = new CreateBoardUseCase(boardsRepository, boardColumnsRepository);
  });

  it('should create a personal board', async () => {
    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      title: 'My Tasks',
    });

    expect(board.title).toBe('My Tasks');
    expect(board.type).toBe('PERSONAL');
    expect(board.ownerId).toBe('user-1');
    expect(boardsRepository.items).toHaveLength(1);
  });

  it('should create a team board with teamId', async () => {
    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      title: 'Sprint Board',
      type: 'TEAM',
      teamId: 'team-1',
    });

    expect(board.type).toBe('TEAM');
    expect(board.teamId).toBe('team-1');
  });

  it('should reject empty title', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: '',
      }),
    ).rejects.toThrow('Board title is required');
  });

  it('should reject title longer than 256 characters', async () => {
    const longTitle = 'A'.repeat(257);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: longTitle,
      }),
    ).rejects.toThrow('Board title must be at most 256 characters');
  });

  it('should set default values for type, visibility, and defaultView', async () => {
    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      title: 'Default Board',
    });

    expect(board.type).toBe('PERSONAL');
    expect(board.visibility).toBe('PRIVATE');
    expect(board.defaultView).toBe('KANBAN');
  });

  it('should reject team board without teamId', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Team Board',
        type: 'TEAM',
      }),
    ).rejects.toThrow('Team ID is required for team boards');
  });

  it('should reject personal board with teamId', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Personal Board',
        type: 'PERSONAL',
        teamId: 'team-1',
      }),
    ).rejects.toThrow('Personal boards cannot have a team ID');
  });

  it('should create 3 default columns', async () => {
    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      title: 'Board With Columns',
    });

    expect(board.columns).toHaveLength(3);
    expect(board.columns[0].title).toBe('A Fazer');
    expect(board.columns[0].position).toBe(0);
    expect(board.columns[0].isDefault).toBe(true);
    expect(board.columns[0].isDone).toBe(false);

    expect(board.columns[1].title).toBe('Em Progresso');
    expect(board.columns[1].position).toBe(1);
    expect(board.columns[1].isDefault).toBe(false);
    expect(board.columns[1].isDone).toBe(false);

    expect(board.columns[2].title).toBe('Concluído');
    expect(board.columns[2].position).toBe(2);
    expect(board.columns[2].isDefault).toBe(false);
    expect(board.columns[2].isDone).toBe(true);

    expect(boardColumnsRepository.items).toHaveLength(3);
  });
});
