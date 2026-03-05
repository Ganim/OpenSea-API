import { describe, it, expect, beforeEach } from 'vitest';
import { ToggleChecklistItemUseCase } from './toggle-checklist-item';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: ToggleChecklistItemUseCase;

describe('ToggleChecklistItemUseCase', () => {
  beforeEach(() => {
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new ToggleChecklistItemUseCase(
      cardChecklistsRepository,
      cardsRepository,
      cardActivitiesRepository,
    );
  });

  it('should mark a checklist item as completed', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    const checklist = await cardChecklistsRepository.create({
      cardId: card.id.toString(),
      title: 'My Checklist',
      position: 0,
    });

    const item = await cardChecklistsRepository.addItem({
      checklistId: checklist.id,
      title: 'Buy groceries',
      position: 0,
    });

    const { checklistItem } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      cardId: card.id.toString(),
      checklistId: checklist.id,
      itemId: item.id,
      isCompleted: true,
    });

    expect(checklistItem.isCompleted).toBe(true);
  });

  it('should unmark a checklist item', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    const checklist = await cardChecklistsRepository.create({
      cardId: card.id.toString(),
      title: 'My Checklist',
      position: 0,
    });

    const item = await cardChecklistsRepository.addItem({
      checklistId: checklist.id,
      title: 'Buy groceries',
      isCompleted: true,
      position: 0,
    });

    const { checklistItem } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      cardId: card.id.toString(),
      checklistId: checklist.id,
      itemId: item.id,
      isCompleted: false,
    });

    expect(checklistItem.isCompleted).toBe(false);
  });

  it('should record activity when marking as completed', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Deploy Feature',
      reporterId: 'user-1',
    });

    const checklist = await cardChecklistsRepository.create({
      cardId: card.id.toString(),
      title: 'Release Checklist',
      position: 0,
    });

    const item = await cardChecklistsRepository.addItem({
      checklistId: checklist.id,
      title: 'Run tests',
      position: 0,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      cardId: card.id.toString(),
      checklistId: checklist.id,
      itemId: item.id,
      isCompleted: true,
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    const activity = cardActivitiesRepository.items[0];
    expect(activity.cardId).toBe(card.id.toString());
    expect(activity.type).toBe('CHECKLIST_ITEM_COMPLETED');
    expect(activity.description).toContain('John Doe');
    expect(activity.description).toContain('Run tests');
    expect(activity.description).toContain('Deploy Feature');
    expect(activity.description).toContain('marcou');
    expect(activity.description).toContain('concluído');
  });

  it('should record activity when unmarking', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Deploy Feature',
      reporterId: 'user-1',
    });

    const checklist = await cardChecklistsRepository.create({
      cardId: card.id.toString(),
      title: 'Release Checklist',
      position: 0,
    });

    const item = await cardChecklistsRepository.addItem({
      checklistId: checklist.id,
      title: 'Run tests',
      isCompleted: true,
      position: 0,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      cardId: card.id.toString(),
      checklistId: checklist.id,
      itemId: item.id,
      isCompleted: false,
    });

    const activity = cardActivitiesRepository.items[0];
    expect(activity.type).toBe('CHECKLIST_ITEM_UNCOMPLETED');
    expect(activity.description).toContain('desmarcou');
    expect(activity.description).toContain('Run tests');
    expect(activity.description).toContain('Deploy Feature');
  });

  it('should reject if checklist item is not found', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'John Doe',
        boardId: 'board-1',
        cardId: card.id.toString(),
        checklistId: 'non-existent',
        itemId: 'non-existent',
        isCompleted: true,
      }),
    ).rejects.toThrow('Checklist item not found');
  });
});
