import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCardUseCase } from './create-card';
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
let sut: CreateCardUseCase;

describe('CreateCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    boardColumnsRepository = new InMemoryBoardColumnsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new CreateCardUseCase(
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
      title: 'Concluído',
      position: 1,
      isDefault: false,
      isDone: true,
    });
  });

  it('should create a card in the default column', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      title: 'My first card',
    });

    expect(card.title).toBe('My first card');
    expect(card.status).toBe('OPEN');
    expect(card.priority).toBe('NONE');
    expect(card.reporterId).toBe('user-1');
    expect(card.columnId).toBe(boardColumnsRepository.items[0].id);
    expect(cardsRepository.items).toHaveLength(1);
  });

  it('should create a card in a specific column', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const doneColumnId = boardColumnsRepository.items[1].id;

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      columnId: doneColumnId,
      title: 'Done card',
    });

    expect(card.columnId).toBe(doneColumnId);
  });

  it('should reject empty title', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        title: '',
      }),
    ).rejects.toThrow('Card title is required');
  });

  it('should reject title longer than 512 characters', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const longTitle = 'A'.repeat(513);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        title: longTitle,
      }),
    ).rejects.toThrow('Card title must be at most 512 characters');
  });

  it('should set default values for status and priority', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      title: 'Default values card',
    });

    expect(card.status).toBe('OPEN');
    expect(card.priority).toBe('NONE');
  });

  it('should create a card with assignee, dates, and metadata', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const startDate = new Date('2026-03-01');
    const dueDate = new Date('2026-03-15');

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      title: 'Full card',
      assigneeId: 'user-2',
      startDate,
      dueDate,
      estimatedMinutes: 120,
      coverColor: '#FF5733',
      metadata: { source: 'import' },
    });

    expect(card.assigneeId).toBe('user-2');
    expect(card.startDate).toEqual(startDate);
    expect(card.dueDate).toEqual(dueDate);
    expect(card.estimatedMinutes).toBe(120);
    expect(card.coverColor).toBe('#FF5733');
    expect(card.metadata).toEqual({ source: 'import' });
  });

  it('should create a card with systemSource', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      title: 'System card',
      systemSourceType: 'FINANCE_ENTRY',
      systemSourceId: 'entry-123',
    });

    expect(card.systemSourceType).toBe('FINANCE_ENTRY');
    expect(card.systemSourceId).toBe('entry-123');
  });

  it('should record a CREATED activity', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      title: 'Activity card',
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('CREATED');
    expect(cardActivitiesRepository.items[0].description).toBe(
      'João criou o cartão Activity card',
    );
  });

  it('should auto-calculate position based on existing cards in column', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      title: 'First card',
    });

    const { card: secondCard } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      title: 'Second card',
    });

    expect(secondCard.position).toBe(1);
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId: 'nonexistent-board',
        title: 'Card',
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should reject if specified column does not exist', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        columnId: 'nonexistent-column',
        title: 'Card',
      }),
    ).rejects.toThrow('Column not found');
  });
});
