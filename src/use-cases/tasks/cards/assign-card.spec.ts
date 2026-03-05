import { describe, it, expect, beforeEach } from 'vitest';
import { AssignCardUseCase } from './assign-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: AssignCardUseCase;

describe('AssignCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new AssignCardUseCase(
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

  it('should assign a user to a card', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: 'user-2',
      assigneeName: 'Maria',
    });

    expect(card.assigneeId).toBe('user-2');
  });

  it('should reassign a card to a different user', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: 'user-2',
      assigneeName: 'Maria',
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: 'user-3',
      assigneeName: 'Carlos',
    });

    expect(card.assigneeId).toBe('user-3');
  });

  it('should unassign a card by passing null', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: 'user-2',
      assigneeName: 'Maria',
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: null,
    });

    expect(card.assigneeId).toBeNull();
  });

  it('should record ASSIGNED activity', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: 'user-2',
      assigneeName: 'Maria',
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('ASSIGNED');
    expect(cardActivitiesRepository.items[0].description).toBe(
      'João atribuiu Maria como responsável pelo cartão Test Card',
    );
  });

  it('should record unassign activity', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: 'user-2',
      assigneeName: 'Maria',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      assigneeId: null,
    });

    const unassignActivity = cardActivitiesRepository.items[1];

    expect(unassignActivity.type).toBe('ASSIGNED');
    expect(unassignActivity.description).toBe(
      'João removeu o responsável do cartão Test Card',
    );
    expect(unassignActivity.newValue).toBeNull();
  });
});
