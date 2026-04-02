import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Board } from '@/entities/tasks/board';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddCardMemberUseCase } from './add-card-member';

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
  const cardsRepository = { findById: vi.fn() } as unknown;
  const cardWatchersRepository = { addMember: vi.fn() } as unknown;
  const cardActivitiesRepository = { create: vi.fn() } as unknown;

  const sut = new AddCardMemberUseCase(
    boardsRepository,
    boardMembersRepository,
    cardsRepository,
    cardWatchersRepository,
    cardActivitiesRepository,
  );

  return {
    sut,
    boardsRepository,
    boardMembersRepository,
    cardsRepository,
    cardWatchersRepository,
    cardActivitiesRepository,
  };
}

describe('AddCardMemberUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should add a card member who is a board member', async () => {
    const board = makeBoard();
    const memberRecord = {
      id: 'watcher-1',
      cardId,
      userId: memberId,
      boardId,
      role: 'MEMBER',
      createdAt: new Date(),
    };

    mocks.boardsRepository.findById.mockResolvedValue(board);
    // verifyBoardAccess: userId is the board owner, so findByBoardAndUser is NOT called.
    // Only the membership check for memberId calls findByBoardAndUser.
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue({
      id: 'bm-1',
      boardId,
      userId: memberId,
      role: 'EDITOR',
    });
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
    });
    mocks.cardWatchersRepository.addMember.mockResolvedValue(memberRecord);
    mocks.cardActivitiesRepository.create.mockResolvedValue({});

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      userName: 'Admin',
      boardId,
      cardId,
      memberId,
      memberName: 'John',
    });

    expect(result.member).toEqual(memberRecord);
    expect(mocks.cardActivitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MEMBER_ADDED' }),
    );
  });

  it('should allow adding the board owner as a card member', async () => {
    const board = makeBoard({ ownerId: memberId });
    mocks.boardsRepository.findById.mockResolvedValue(board);
    // verifyBoardAccess for userId - userId is not owner, must be member
    mocks.boardMembersRepository.findByBoardAndUser
      .mockResolvedValueOnce({ id: 'bm-0', boardId, userId, role: 'EDITOR' }) // for verifyBoardAccess
      .mockResolvedValueOnce(null); // for memberId board membership check (null but owner)
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
    });
    mocks.cardWatchersRepository.addMember.mockResolvedValue({ id: 'w-1' });
    mocks.cardActivitiesRepository.create.mockResolvedValue({});

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      userName: 'Admin',
      boardId,
      cardId,
      memberId,
    });

    expect(result.member).toBeDefined();
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

  it('should throw ForbiddenError when member is not a board member nor owner', async () => {
    const board = makeBoard();
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue(null); // for both calls
    mocks.cardsRepository.findById.mockResolvedValue({
      id: cardId,
      title: 'Card',
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

  it('should throw ResourceNotFoundError when card does not exist', async () => {
    const board = makeBoard();
    mocks.boardsRepository.findById.mockResolvedValue(board);
    mocks.boardMembersRepository.findByBoardAndUser.mockResolvedValue({
      id: 'bm-1',
      boardId,
      userId: memberId,
      role: 'EDITOR',
    });
    mocks.cardsRepository.findById.mockResolvedValue(null);

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
});
