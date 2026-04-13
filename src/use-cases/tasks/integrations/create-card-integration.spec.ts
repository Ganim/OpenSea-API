import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Board } from '@/entities/tasks/board';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCardIntegrationUseCase } from './create-card-integration';

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
  const boardsRepository = {
    findById: vi.fn(),
  };

  const boardMembersRepository = {
    findByBoardAndUser: vi.fn(),
  };

  const cardsRepository = {
    findById: vi.fn(),
  };

  const cardIntegrationsRepository = {
    findByCardAndEntity: vi.fn(),
    create: vi.fn(),
  };

  const cardActivitiesRepository = {
    create: vi.fn(),
  };

  const sut = new CreateCardIntegrationUseCase(
    boardsRepository as any,
    boardMembersRepository as any,
    cardsRepository as any,
    cardIntegrationsRepository as any,
    cardActivitiesRepository as any,
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

describe('CreateCardIntegrationUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should create a card integration successfully', async () => {
    const board = makeBoard();
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue(null);
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
    });
    mocks.cardIntegrationsRepository.findByCardAndEntity.mockResolvedValue(
      null,
    );

    const integration = {
      id: 'int-1',
      cardId,
      type: 'ORDER',
      entityId: 'order-1',
      entityLabel: 'Pedido #123',
      createdBy: userId,
      createdAt: new Date(),
    };
    mocks.cardIntegrationsRepository.create.mockResolvedValue(integration);
    mocks.cardActivitiesRepository.create.mockResolvedValue({});

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      userName: 'User',
      boardId,
      cardId,
      type: 'ORDER',
      entityId: 'order-1',
      entityLabel: 'Pedido #123',
    });

    expect(result.integration).toEqual(integration);
    expect(mocks.cardActivitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INTEGRATION_ADDED' }),
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
        type: 'ORDER',
        entityId: 'order-1',
        entityLabel: 'Pedido #123',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when user has no board access', async () => {
    const board = makeBoard({ ownerId: 'other-user' });
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'User',
        boardId,
        cardId,
        type: 'ORDER',
        entityId: 'order-1',
        entityLabel: 'Pedido #123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError when card does not exist', async () => {
    const board = makeBoard();
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.cardsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'User',
        boardId,
        cardId,
        type: 'ORDER',
        entityId: 'order-1',
        entityLabel: 'Pedido #123',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ConflictError when integration already exists', async () => {
    const board = makeBoard();
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
    });
    mocks.cardIntegrationsRepository.findByCardAndEntity.mockResolvedValue({
      id: 'existing',
    });

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'User',
        boardId,
        cardId,
        type: 'ORDER',
        entityId: 'order-1',
        entityLabel: 'Pedido #123',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
