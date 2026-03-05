import { describe, it, expect, beforeEach } from 'vitest';
import { ListSubtasksUseCase } from './list-subtasks';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';

let cardsRepository: InMemoryCardsRepository;
let sut: ListSubtasksUseCase;

describe('ListSubtasksUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    sut = new ListSubtasksUseCase(cardsRepository);
  });

  it('should list subtasks for a parent card', async () => {
    const parentCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 1',
      reporterId: 'user-1',
      position: 0,
    });

    await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 2',
      reporterId: 'user-1',
      position: 1,
    });

    const { subtasks } = await sut.execute({
      tenantId: 'tenant-1',
      boardId: 'board-1',
      parentCardId: parentCard.id.toString(),
    });

    expect(subtasks).toHaveLength(2);
    expect(subtasks[0].title).toBe('Subtask 1');
    expect(subtasks[1].title).toBe('Subtask 2');
  });

  it('should return empty list when no subtasks exist', async () => {
    const { subtasks } = await sut.execute({
      tenantId: 'tenant-1',
      boardId: 'board-1',
      parentCardId: 'some-card-id',
    });

    expect(subtasks).toHaveLength(0);
  });
});
