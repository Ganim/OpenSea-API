import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Board } from '@/entities/tasks/board';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListCardIntegrationsUseCase } from './list-card-integrations';

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
  const boardsRepository = { findById: vi.fn() };
  const boardMembersRepository = { findByBoardAndUser: vi.fn() };
  const cardIntegrationsRepository = { findByCardId: vi.fn() };

  const sut = new ListCardIntegrationsUseCase(
    boardsRepository as any,
    boardMembersRepository as any,
    cardIntegrationsRepository as any,
  );

  return {
    sut,
    boardsRepository,
    boardMembersRepository,
    cardIntegrationsRepository,
  };
}

describe('ListCardIntegrationsUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should list card integrations successfully', async () => {
    const board = makeBoard();
    const integrations = [
      {
        id: 'int-1',
        cardId,
        type: 'ORDER',
        entityId: 'order-1',
        entityLabel: 'Pedido #1',
        createdBy: userId,
        createdAt: new Date(),
      },
      {
        id: 'int-2',
        cardId,
        type: 'PRODUCT',
        entityId: 'prod-1',
        entityLabel: 'Produto A',
        createdBy: userId,
        createdAt: new Date(),
      },
    ];

    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.cardIntegrationsRepository.findByCardId.mockResolvedValue(
      integrations,
    );

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      boardId,
      cardId,
    });

    expect(result.integrations).toHaveLength(2);
    expect(result.integrations).toEqual(integrations);
  });

  it('should return empty array when card has no integrations', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardIntegrationsRepository.findByCardId.mockResolvedValue([]);

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      boardId,
      cardId,
    });

    expect(result.integrations).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when board does not exist', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, userId, boardId, cardId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when user is not a board member', async () => {
    const board = makeBoard({ ownerId: 'other-user' });
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, userId, boardId, cardId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
