import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCardUseCase } from './update-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: UpdateCardUseCase;

describe('UpdateCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new UpdateCardUseCase(
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
      title: 'Original Title',
      reporterId: 'user-1',
      status: 'OPEN',
      priority: 'LOW',
      position: 0,
    });
  });

  it('should update the card title', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      title: 'Updated Title',
    });

    expect(card.title).toBe('Updated Title');
  });

  it('should record activity with human-readable priority labels', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'Maria',
      boardId,
      cardId,
      priority: 'HIGH',
    });

    const priorityActivity = cardActivitiesRepository.items.find(
      (activity) => activity.field === 'priority',
    );

    expect(priorityActivity).toBeDefined();
    expect(priorityActivity!.description).toBe(
      'Maria alterou a prioridade do cartão Original Title de Baixa para Alta',
    );
    expect(priorityActivity!.oldValue).toBe('LOW');
    expect(priorityActivity!.newValue).toBe('HIGH');
  });

  it('should set completedAt when status changes to DONE', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      status: 'DONE',
    });

    expect(card.completedAt).toBeTruthy();
    expect(card.status).toBe('DONE');
  });

  it('should reset completedAt when status changes from DONE to another status', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      status: 'DONE',
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      status: 'IN_PROGRESS',
    });

    expect(card.completedAt).toBeNull();
    expect(card.status).toBe('IN_PROGRESS');
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
        title: 'New Title',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should record activity with human-readable status labels', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'Carlos',
      boardId,
      cardId,
      status: 'IN_PROGRESS',
    });

    const statusActivity = cardActivitiesRepository.items.find(
      (activity) => activity.field === 'status',
    );

    expect(statusActivity).toBeDefined();
    expect(statusActivity!.description).toBe(
      'Carlos alterou o status do cartão Original Title de Aberto para Em Progresso',
    );
  });
});
