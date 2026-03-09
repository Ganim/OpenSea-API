import { describe, it, expect, beforeEach } from 'vitest';
import { CompleteSubtaskUseCase } from './complete-subtask';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: CompleteSubtaskUseCase;

describe('CompleteSubtaskUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new CompleteSubtaskUseCase(cardsRepository, cardActivitiesRepository);
  });

  it('should complete a subtask', async () => {
    const parentCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const subtask = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 1',
      reporterId: 'user-1',
    });

    const { subtask: completedSubtask, allSubtasksDone } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      subtaskId: subtask.id.toString(),
      completed: true,
    });

    expect(completedSubtask.status).toBe('DONE');
    expect(completedSubtask.completedAt).toBeTruthy();
    expect(allSubtasksDone).toBe(true);
  });

  it('should uncomplete a subtask', async () => {
    const parentCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const subtask = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 1',
      reporterId: 'user-1',
      status: 'DONE',
    });

    const { subtask: reopenedSubtask, allSubtasksDone } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      subtaskId: subtask.id.toString(),
      completed: false,
    });

    expect(reopenedSubtask.status).toBe('OPEN');
    expect(reopenedSubtask.completedAt).toBeNull();
    expect(allSubtasksDone).toBe(false);
  });

  it('should record activity on the parent card', async () => {
    const parentCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const subtask = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 1',
      reporterId: 'user-1',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      subtaskId: subtask.id.toString(),
      completed: true,
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    const activity = cardActivitiesRepository.items[0];
    expect(activity.cardId).toBe(parentCard.id.toString());
    expect(activity.type).toBe('SUBTASK_COMPLETED');
    expect(activity.description).toContain('John Doe');
    expect(activity.description).toContain('Subtask 1');
    expect(activity.description).toContain('Parent Task');
  });

  it('should return allSubtasksDone=true only when all sibling subtasks are done', async () => {
    const parentCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const subtask1 = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 1',
      reporterId: 'user-1',
    });

    await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 2',
      reporterId: 'user-1',
    });

    const { allSubtasksDone: afterFirstComplete } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      subtaskId: subtask1.id.toString(),
      completed: true,
    });

    expect(afterFirstComplete).toBe(false);
  });
});
