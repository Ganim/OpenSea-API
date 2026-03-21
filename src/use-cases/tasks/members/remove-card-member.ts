import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardWatchersRepository } from '@/repositories/tasks/card-watchers-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface RemoveCardMemberRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  memberId: string;
  memberName?: string | null;
}

export class RemoveCardMemberUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
    private cardWatchersRepository: CardWatchersRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: RemoveCardMemberRequest): Promise<void> {
    const {
      tenantId,
      userId,
      userName,
      boardId,
      cardId,
      memberId,
      memberName,
    } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    await verifyBoardAccess(
      this.boardMembersRepository,
      board,
      userId,
      'write',
    );

    await this.cardWatchersRepository.removeMember(cardId, memberId);

    const displayName = memberName ?? memberId;

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'MEMBER_REMOVED',
      description: `${userName} removeu ${displayName} como membro do cartão`,
    });
  }
}
