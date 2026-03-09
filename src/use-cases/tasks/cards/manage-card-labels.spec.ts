import { describe, it, expect, beforeEach } from 'vitest';
import { ManageCardLabelsUseCase } from './manage-card-labels';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryBoardLabelsRepository } from '@/repositories/tasks/in-memory/in-memory-board-labels-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let boardLabelsRepository: InMemoryBoardLabelsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: ManageCardLabelsUseCase;

describe('ManageCardLabelsUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    boardLabelsRepository = new InMemoryBoardLabelsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new ManageCardLabelsUseCase(
      boardsRepository,
      cardsRepository,
      boardLabelsRepository,
      cardActivitiesRepository,
      boardMembersRepository,
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

    await boardLabelsRepository.create({
      boardId,
      name: 'Bug',
      color: '#FF0000',
    });

    await boardLabelsRepository.create({
      boardId,
      name: 'Feature',
      color: '#00FF00',
    });

    await boardLabelsRepository.create({
      boardId,
      name: 'Improvement',
      color: '#0000FF',
    });
  });

  it('should add labels to a card', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();
    const bugLabelId = boardLabelsRepository.items[0].id;
    const featureLabelId = boardLabelsRepository.items[1].id;

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      labelIds: [bugLabelId, featureLabelId],
    });

    const cardLabels = cardsRepository.cardLabelAssignments.get(cardId);
    expect(cardLabels).toHaveLength(2);
    expect(cardLabels).toContain(bugLabelId);
    expect(cardLabels).toContain(featureLabelId);

    expect(cardActivitiesRepository.items).toHaveLength(2);
    expect(cardActivitiesRepository.items[0].type).toBe('LABEL_ADDED');
    expect(cardActivitiesRepository.items[0].description).toContain('Bug');
  });

  it('should replace labels on a card', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();
    const bugLabelId = boardLabelsRepository.items[0].id;
    const featureLabelId = boardLabelsRepository.items[1].id;
    const improvementLabelId = boardLabelsRepository.items[2].id;

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      labelIds: [bugLabelId, featureLabelId],
    });

    cardActivitiesRepository.items = [];

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      labelIds: [featureLabelId, improvementLabelId],
    });

    const cardLabels = cardsRepository.cardLabelAssignments.get(cardId);
    expect(cardLabels).toHaveLength(2);
    expect(cardLabels).toContain(featureLabelId);
    expect(cardLabels).toContain(improvementLabelId);

    const addedActivities = cardActivitiesRepository.items.filter(
      (a) => a.type === 'LABEL_ADDED',
    );
    const removedActivities = cardActivitiesRepository.items.filter(
      (a) => a.type === 'LABEL_REMOVED',
    );

    expect(addedActivities).toHaveLength(1);
    expect(addedActivities[0].description).toContain('Improvement');
    expect(removedActivities).toHaveLength(1);
    expect(removedActivities[0].description).toContain('Bug');
  });

  it('should remove all labels from a card', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();
    const bugLabelId = boardLabelsRepository.items[0].id;

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      labelIds: [bugLabelId],
    });

    cardActivitiesRepository.items = [];

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      labelIds: [],
    });

    const cardLabels = cardsRepository.cardLabelAssignments.get(cardId);
    expect(cardLabels).toHaveLength(0);

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('LABEL_REMOVED');
  });

  it('should reject labels that do not belong to the board', async () => {
    const boardId = boardsRepository.items[0].id.toString();
    const cardId = cardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        cardId,
        labelIds: ['nonexistent-label'],
      }),
    ).rejects.toThrow('Label nonexistent-label does not belong to this board');
  });
});
