import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveCardUseCase } from './archive-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: ArchiveCardUseCase;

describe('ArchiveCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new ArchiveCardUseCase(
      boardsRepository,
      cardsRepository,
      cardActivitiesRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    const boardId = boardsRepository.items[0].id.toString();

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
      position: 0,
    });
  });

  it('should archive a card', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      archive: true,
    });

    expect(card.archivedAt).toBeTruthy();

    const activity = cardActivitiesRepository.items[0];
    expect(activity.type).toBe('ARCHIVED');
    expect(activity.description).toBe('João arquivou o cartão Test Card');
  });

  it('should restore an archived card', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      archive: true,
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      archive: false,
    });

    expect(card.archivedAt).toBeNull();

    const restoreActivity = cardActivitiesRepository.items[1];
    expect(restoreActivity.type).toBe('RESTORED');
    expect(restoreActivity.description).toBe(
      'João restaurou o cartão Test Card',
    );
  });

  it('should reject if card is not found', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        cardId: 'nonexistent-card',
        archive: true,
      }),
    ).rejects.toThrow('Card not found');
  });
});
