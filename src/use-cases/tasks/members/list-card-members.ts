import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  CardMemberRecord,
  CardWatchersRepository,
} from '@/repositories/tasks/card-watchers-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface ListCardMembersRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
}

interface ListCardMembersResponse {
  members: CardMemberRecord[];
}

export class ListCardMembersUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
    private cardWatchersRepository: CardWatchersRepository,
  ) {}

  async execute(
    request: ListCardMembersRequest,
  ): Promise<ListCardMembersResponse> {
    const { tenantId, userId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    await verifyBoardAccess(
      this.boardMembersRepository,
      board,
      userId,
      'read',
    );

    const members =
      await this.cardWatchersRepository.findMembersByCardId(cardId);

    return { members };
  }
}
