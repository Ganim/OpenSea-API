import { describe, it, expect, beforeEach } from 'vitest';
import { ListLabelsUseCase } from './list-labels';
import { InMemoryBoardLabelsRepository } from '@/repositories/tasks/in-memory/in-memory-board-labels-repository';

let boardLabelsRepository: InMemoryBoardLabelsRepository;
let sut: ListLabelsUseCase;

describe('ListLabelsUseCase', () => {
  beforeEach(() => {
    boardLabelsRepository = new InMemoryBoardLabelsRepository();
    sut = new ListLabelsUseCase(boardLabelsRepository);
  });

  it('should list labels for a board sorted by position', async () => {
    await boardLabelsRepository.create({
      boardId: 'board-1',
      name: 'Feature',
      color: '#00FF00',
      position: 1,
    });

    await boardLabelsRepository.create({
      boardId: 'board-1',
      name: 'Bug',
      color: '#FF0000',
      position: 0,
    });

    await boardLabelsRepository.create({
      boardId: 'board-2',
      name: 'Other Board Label',
      color: '#0000FF',
      position: 0,
    });

    const { labels } = await sut.execute({ boardId: 'board-1' });

    expect(labels).toHaveLength(2);
    expect(labels[0].name).toBe('Bug');
    expect(labels[1].name).toBe('Feature');
  });

  it('should return empty array when board has no labels', async () => {
    const { labels } = await sut.execute({ boardId: 'board-1' });

    expect(labels).toHaveLength(0);
  });
});
