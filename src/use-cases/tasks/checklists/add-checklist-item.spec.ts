import { describe, it, expect, beforeEach } from 'vitest';
import { AddChecklistItemUseCase } from './add-checklist-item';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';

let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let sut: AddChecklistItemUseCase;

describe('AddChecklistItemUseCase', () => {
  beforeEach(() => {
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    sut = new AddChecklistItemUseCase(cardChecklistsRepository);
  });

  it('should add an item to a checklist', async () => {
    const checklist = await cardChecklistsRepository.create({
      cardId: 'card-1',
      title: 'My Checklist',
      position: 0,
    });

    const { checklistItem } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      cardId: 'card-1',
      checklistId: checklist.id,
      title: 'Buy milk',
    });

    expect(checklistItem.title).toBe('Buy milk');
    expect(checklistItem.checklistId).toBe(checklist.id);
    expect(checklistItem.isCompleted).toBe(false);
    expect(checklistItem.position).toBe(0);
    expect(checklistItem.assigneeId).toBeNull();
    expect(checklistItem.dueDate).toBeNull();
  });

  it('should add an item with assignee and due date', async () => {
    const checklist = await cardChecklistsRepository.create({
      cardId: 'card-1',
      title: 'My Checklist',
      position: 0,
    });

    const itemDueDate = new Date('2026-04-01');

    const { checklistItem } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      cardId: 'card-1',
      checklistId: checklist.id,
      title: 'Review PR',
      assigneeId: 'assignee-1',
      dueDate: itemDueDate,
    });

    expect(checklistItem.title).toBe('Review PR');
    expect(checklistItem.assigneeId).toBe('assignee-1');
    expect(checklistItem.dueDate).toEqual(itemDueDate);
  });

  it('should auto-calculate position for subsequent items', async () => {
    const checklist = await cardChecklistsRepository.create({
      cardId: 'card-1',
      title: 'My Checklist',
      position: 0,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      cardId: 'card-1',
      checklistId: checklist.id,
      title: 'First item',
    });

    const { checklistItem: secondItem } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      cardId: 'card-1',
      checklistId: checklist.id,
      title: 'Second item',
    });

    expect(secondItem.position).toBe(1);
    expect(cardChecklistsRepository.checklistItems).toHaveLength(2);
  });

  it('should reject if checklist is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'card-1',
        checklistId: 'non-existent',
        title: 'Some item',
      }),
    ).rejects.toThrow('Checklist not found');
  });
});
