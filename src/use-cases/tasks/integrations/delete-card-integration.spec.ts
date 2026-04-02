import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Board } from '@/entities/tasks/board';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteCardIntegrationUseCase } from './delete-card-integration';

const tenantId = 'tenant-1';
const userId = 'user-1';
const boardId = 'board-1';
const cardId = 'card-1';

function makeBoard(overrides?: Partial<{ ownerId: string }>) {
  return Board.create(
    {
      tenantId: new UniqueEntityID(tenantId),
      title: 'Board',
      type: 'KANBAN',
      ownerId: new UniqueEntityID(overrides?.ownerId ?? userId),
      visibility: 'PRIVATE',
      defaultView: 'BOARD',
      position: 0,
    },
    new UniqueEntityID(boardId),
  );
}

function makeMocks() {
  const boardsRepository = { findById: vi.fn() } as unknown;
  const boardMembersRepository = { findByBoardAndUser: vi.fn() } as unknown;
  const cardsRepository = { findById: vi.fn() } as unknown;
  const cardIntegrationsRepository = {
    findById: vi.fn(),
    delete: vi.fn(),
  } as unknown;
  const cardActivitiesRepository = { create: vi.fn() } as unknown;

  const sut = new DeleteCardIntegrationUseCase(
    boardsRepository,
    boardMembersRepository,
    cardsRepository,
    cardIntegrationsRepository,
    cardActivitiesRepository,
  );

  return {
    sut,
    boardsRepository,
    boardMembersRepository,
    cardsRepository,
    cardIntegrationsRepository,
    cardActivitiesRepository,
  };
}

describe('DeleteCardIntegrationUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should delete a card integration successfully', async () => {
    const board = makeBoard();
    const integration = {
      id: 'int-1',
      cardId,
      type: 'ORDER',
      entityId: 'order-1',
      entityLabel: 'Pedido #123',
      createdBy: userId,
      createdAt: new Date(),
    };

    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
    });
    mocks.cardIntegrationsRepository.findById.mockResolvedValue(integration);
    mocks.cardIntegrationsRepository.delete.mockResolvedValue(undefined);
    mocks.cardActivitiesRepository.create.mockResolvedValue({});

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      userName: 'User',
      boardId,
      cardId,
      integrationId: 'int-1',
    });

    expect(result.deletedIntegration).toEqual(integration);
    expect(mocks.cardIntegrationsRepository.delete).toHaveBeenCalledWith(
      'int-1',
    );
    expect(mocks.cardActivitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INTEGRATION_REMOVED' }),
    );
  });

  it('should throw ResourceNotFoundError when board does not exist', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'User',
        boardId,
        cardId,
        integrationId: 'int-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when card does not exist', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'User',
        boardId,
        cardId,
        integrationId: 'int-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when integration does not exist', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
    });
    mocks.cardIntegrationsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'User',
        boardId,
        cardId,
        integrationId: 'int-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when integration belongs to different card', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
    });
    mocks.cardIntegrationsRepository.findById.mockResolvedValue({
      id: 'int-1',
      cardId: 'other-card',
    });

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'User',
        boardId,
        cardId,
        integrationId: 'int-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
