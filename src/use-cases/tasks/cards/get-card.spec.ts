import { describe, it, expect, beforeEach } from 'vitest';
import { GetCardUseCase } from './get-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardLabelsRepository } from '@/repositories/tasks/in-memory/in-memory-board-labels-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardLabelsRepository: InMemoryBoardLabelsRepository;
let cardsRepository: InMemoryCardsRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: GetCardUseCase;

describe('GetCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    boardLabelsRepository = new InMemoryBoardLabelsRepository();
    cardsRepository = new InMemoryCardsRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new GetCardUseCase(
      boardsRepository,
      cardsRepository,
      boardLabelsRepository,
      boardMembersRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should get a card with its relations', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const label1 = await boardLabelsRepository.create({
      boardId,
      name: 'Bug',
      color: '#ff0000',
    });
    const label2 = await boardLabelsRepository.create({
      boardId,
      name: 'Feature',
      color: '#00ff00',
    });

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Test Card',
      description: 'Test description',
      reporterId: 'user-1',
      position: 0,
      labelIds: [label1.id, label2.id],
    });

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Subtask 1',
      reporterId: 'user-1',
      parentCardId: createdCard.id.toString(),
      position: 0,
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      cardId: createdCard.id.toString(),
    });

    expect(card.title).toBe('Test Card');
    expect(card.description).toBe('Test description');
    expect(card.labels).toHaveLength(2);
    expect(card.subtaskCount).toBe(1);
  });

  it('should reject if card is not found', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        cardId: 'nonexistent-card',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'nonexistent-board',
        cardId: 'card-1',
      }),
    ).rejects.toThrow('Board not found');
  });
});
