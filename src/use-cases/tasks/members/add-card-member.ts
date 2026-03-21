import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import type {
  CardWatcherRecord,
  CardWatchersRepository,
} from '@/repositories/tasks/card-watchers-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface AddCardMemberRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  memberId: string;
  memberName?: string | null;
}

interface AddCardMemberResponse {
  member: CardWatcherRecord;
}

export class AddCardMemberUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
    private cardsRepository: CardsRepository,
    private cardWatchersRepository: CardWatchersRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: AddCardMemberRequest): Promise<AddCardMemberResponse> {
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

    const boardMembership =
      await this.boardMembersRepository.findByBoardAndUser(boardId, memberId);

    const isBoardOwner = board.ownerId.toString() === memberId;

    if (!boardMembership && !isBoardOwner) {
      throw new ForbiddenError(
        'User must be a board member to be added as a card member',
      );
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const member = await this.cardWatchersRepository.addMember({
      cardId,
      userId: memberId,
      addedBy: userId,
    });

    const displayName = memberName ?? memberId;

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'MEMBER_ADDED',
      description: `${userName} adicionou ${displayName} como membro do cartão ${card.title}`,
    });

    return { member };
  }
}
