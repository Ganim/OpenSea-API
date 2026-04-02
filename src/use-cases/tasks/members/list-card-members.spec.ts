import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Board } from '@/entities/tasks/board';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListCardMembersUseCase } from './list-card-members';

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
  const cardWatchersRepository = { findMembersByCardId: vi.fn() } as unknown;

  const sut = new ListCardMembersUseCase(
    boardsRepository,
    boardMembersRepository,
    cardWatchersRepository,
  );

  return {
    sut,
    boardsRepository,
    boardMembersRepository,
    cardWatchersRepository,
  };
}

describe('ListCardMembersUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should list card members successfully', async () => {
    const members = [
      {
        id: 'm-1',
        cardId,
        userId: 'u-1',
        userName: 'John',
        userEmail: 'john@test.com',
        addedAt: new Date(),
      },
      {
        id: 'm-2',
        cardId,
        userId: 'u-2',
        userName: 'Jane',
        userEmail: 'jane@test.com',
        addedAt: new Date(),
      },
    ];

    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardWatchersRepository.findMembersByCardId.mockResolvedValue(members);

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      boardId,
      cardId,
    });

    expect(result.members).toHaveLength(2);
    expect(result.members).toEqual(members);
  });

  it('should return empty array when no members exist', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardWatchersRepository.findMembersByCardId.mockResolvedValue([]);

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      boardId,
      cardId,
    });

    expect(result.members).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when board does not exist', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, userId, boardId, cardId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when user has no read access', async () => {
    const board = makeBoard({ ownerId: 'other-user' });
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, userId, boardId, cardId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
