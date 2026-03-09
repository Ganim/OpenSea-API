import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface AssignCardRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  assigneeId: string | null;
  assigneeName?: string | null;
}

interface AssignCardResponse {
  card: CardDTO;
}

export class AssignCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(request: AssignCardRequest): Promise<AssignCardResponse> {
    const {
      tenantId,
      userId,
      userName,
      boardId,
      cardId,
      assigneeId,
      assigneeName,
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

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const oldAssigneeId = card.assigneeId?.toString() ?? null;

    const updatedCard = await this.cardsRepository.update({
      id: cardId,
      boardId,
      assigneeId,
    });

    if (!updatedCard) {
      throw new ResourceNotFoundError('Card not found');
    }

    if (assigneeId) {
      const displayName = assigneeName ?? assigneeId;

      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'ASSIGNED',
        description: `${userName} atribuiu ${displayName} como responsável pelo cartão ${card.title}`,
        field: 'assigneeId',
        oldValue: oldAssigneeId,
        newValue: assigneeId,
      });
    } else {
      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'ASSIGNED',
        description: `${userName} removeu o responsável do cartão ${card.title}`,
        field: 'assigneeId',
        oldValue: oldAssigneeId,
        newValue: null,
      });
    }

    return { card: cardToDTO(updatedCard) };
  }
}
