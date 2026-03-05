import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateChecklistUseCase } from './update-checklist';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';

let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let sut: UpdateChecklistUseCase;

describe('UpdateChecklistUseCase', () => {
  beforeEach(() => {
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    sut = new UpdateChecklistUseCase(cardChecklistsRepository);
  });

  it('should update the checklist title', async () => {
    const createdChecklist = await cardChecklistsRepository.create({
      cardId: 'card-1',
      title: 'Original Title',
      position: 0,
    });

    const { checklist } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      cardId: 'card-1',
      checklistId: createdChecklist.id,
      title: 'Updated Title',
    });

    expect(checklist.title).toBe('Updated Title');
    expect(checklist.id).toBe(createdChecklist.id);
  });

  it('should reject if checklist is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'card-1',
        checklistId: 'non-existent',
        title: 'New Title',
      }),
    ).rejects.toThrow('Checklist not found');
  });
});
