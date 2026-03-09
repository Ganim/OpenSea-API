import { describe, it, expect, beforeEach } from 'vitest';
import { CreateLabelUseCase } from './create-label';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardLabelsRepository } from '@/repositories/tasks/in-memory/in-memory-board-labels-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardLabelsRepository: InMemoryBoardLabelsRepository;
let sut: CreateLabelUseCase;

describe('CreateLabelUseCase', () => {
  let boardId: string;

  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    boardLabelsRepository = new InMemoryBoardLabelsRepository();
    sut = new CreateLabelUseCase(boardsRepository, boardLabelsRepository);

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    boardId = boardsRepository.items[0].id.toString();
  });

  it('should create a label', async () => {
    const { label } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'Bug',
      color: '#FF0000',
    });

    expect(label.name).toBe('Bug');
    expect(label.color).toBe('#FF0000');
    expect(label.position).toBe(0);
    expect(boardLabelsRepository.items).toHaveLength(1);
  });

  it('should auto-calculate position for new labels', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'First',
      color: '#FF0000',
    });

    const { label: secondLabel } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'Second',
      color: '#00FF00',
    });

    expect(secondLabel.position).toBe(1);
  });

  it('should reject empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId,
        name: '',
        color: '#FF0000',
      }),
    ).rejects.toThrow('Label name is required');
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId: 'nonexistent-board',
        name: 'Bug',
        color: '#FF0000',
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should trim the label name', async () => {
    const { label } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: '  Bug  ',
      color: '#FF0000',
    });

    expect(label.name).toBe('Bug');
  });

  it('should reject duplicate label names (case-insensitive)', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      name: 'Bug',
      color: '#FF0000',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId,
        name: 'bug',
        color: '#00FF00',
      }),
    ).rejects.toThrow('already exists on this board');
  });
});
