import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Board } from '@/entities/tasks/board';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoveCardMemberUseCase } from './remove-card-member';

const tenantId = 'tenant-1';
const userId = 'user-1';
const boardId = 'board-1';
const cardId = 'card-1';
const memberId = 'member-1';

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
  const cardWatchersRepository = { removeMember: vi.fn() } as unknown;
  const cardActivitiesRepository = { create: vi.fn() } as unknown;

  const sut = new RemoveCardMemberUseCase(
    boardsRepository,
    boardMembersRepository,
    cardWatchersRepository,
    cardActivitiesRepository,
  );

  return {
    sut,
    boardsRepository,
    boardMembersRepository,
    cardWatchersRepository,
    cardActivitiesRepository,
  };
}

describe('RemoveCardMemberUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should remove a card member successfully', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardWatchersRepository.removeMember.mockResolvedValue(undefined);
    mocks.cardActivitiesRepository.create.mockResolvedValue({});

    await mocks.sut.execute({
      tenantId,
      userId,
      userName: 'Admin',
      boardId,
      cardId,
      memberId,
      memberName: 'John',
    });

    expect(mocks.cardWatchersRepository.removeMember).toHaveBeenCalledWith(
      cardId,
      memberId,
    );
    expect(mocks.cardActivitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MEMBER_REMOVED',
        description: expect.stringContaining('John'),
      }),
    );
  });

  it('should use memberId as display name when memberName is not provided', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(makeBoard());
    mocks.cardWatchersRepository.removeMember.mockResolvedValue(undefined);
    mocks.cardActivitiesRepository.create.mockResolvedValue({});

    await mocks.sut.execute({
      tenantId,
      userId,
      userName: 'Admin',
      boardId,
      cardId,
      memberId,
    });

    expect(mocks.cardActivitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining(memberId),
      }),
    );
  });

  it('should throw ResourceNotFoundError when board does not exist', async () => {
    mocks.boardsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'Admin',
        boardId,
        cardId,
        memberId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when user has no write access', async () => {
    const board = makeBoard({ ownerId: 'other-user' });
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue({
      id: 'bm-1',
      boardId,
      userId,
      role: 'VIEWER',
    });

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        userName: 'Admin',
        boardId,
        cardId,
        memberId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
