import { describe, it, expect, beforeEach } from 'vitest';
import { MoveCardUseCase } from './move-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardColumnsRepository: InMemoryBoardColumnsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: MoveCardUseCase;

describe('MoveCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    boardColumnsRepository = new InMemoryBoardColumnsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new MoveCardUseCase(
      boardsRepository,
      boardColumnsRepository,
      cardsRepository,
      cardActivitiesRepository,
      boardMembersRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    const boardId = boardsRepository.items[0].id.toString();

    await boardColumnsRepository.create({
      boardId,
      title: 'A Fazer',
      position: 0,
      isDefault: true,
      isDone: false,
    });

    await boardColumnsRepository.create({
      boardId,
      title: 'Em Progresso',
      position: 1,
      isDefault: false,
      isDone: false,
    });

    await boardColumnsRepository.create({
      boardId,
      title: 'Concluído',
      position: 2,
      isDefault: false,
      isDone: true,
    });
  });

  it('should move a card between columns', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const sourceColumnId = boardColumnsRepository.items[0].id;
    const targetColumnId = boardColumnsRepository.items[1].id;

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: sourceColumnId,
      title: 'Card to move',
      reporterId: 'user-1',
      position: 0,
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId: createdCard.id.toString(),
      columnId: targetColumnId,
    });

    expect(card.columnId).toBe(targetColumnId);
  });

  it('should update position when specified', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const targetColumnId = boardColumnsRepository.items[1].id;

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: boardColumnsRepository.items[0].id,
      title: 'Card to move',
      reporterId: 'user-1',
      position: 0,
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId: createdCard.id.toString(),
      columnId: targetColumnId,
      position: 5,
    });

    expect(card.position).toBe(5);
  });

  it('should record activity with column names', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const sourceColumnId = boardColumnsRepository.items[0].id;
    const targetColumnId = boardColumnsRepository.items[1].id;

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: sourceColumnId,
      title: 'Card to move',
      reporterId: 'user-1',
      position: 0,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'Maria',
      boardId,
      cardId: createdCard.id.toString(),
      columnId: targetColumnId,
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('MOVED');
    expect(cardActivitiesRepository.items[0].description).toBe(
      'Maria moveu o cartão Card to move de A Fazer para Em Progresso',
    );
  });

  it('should auto-complete card when moving to a done column', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const sourceColumnId = boardColumnsRepository.items[0].id;
    const doneColumnId = boardColumnsRepository.items[2].id;

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: sourceColumnId,
      title: 'Card to complete',
      reporterId: 'user-1',
      position: 0,
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId: createdCard.id.toString(),
      columnId: doneColumnId,
    });

    expect(card.status).toBe('DONE');
    expect(card.completedAt).toBeTruthy();
  });

  it('should reset completedAt when moving away from done column', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const doneColumnId = boardColumnsRepository.items[2].id;
    const normalColumnId = boardColumnsRepository.items[0].id;

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: doneColumnId,
      title: 'Completed card',
      reporterId: 'user-1',
      status: 'DONE',
      position: 0,
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId: createdCard.id.toString(),
      columnId: normalColumnId,
    });

    expect(card.completedAt).toBeNull();
  });

  it('should reject if target column does not exist', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: boardColumnsRepository.items[0].id,
      title: 'Card',
      reporterId: 'user-1',
      position: 0,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        cardId: createdCard.id.toString(),
        columnId: 'nonexistent-column',
      }),
    ).rejects.toThrow('Target column not found');
  });
});
