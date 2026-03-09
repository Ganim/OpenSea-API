import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardLabelsRepository } from '@/repositories/tasks/board-labels-repository';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface GetCardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
}

interface GetCardResponse {
  card: CardDTO;
}

export class GetCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private boardLabelsRepository: BoardLabelsRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(request: GetCardRequest): Promise<GetCardResponse> {
    const { tenantId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    await verifyBoardAccess(
      this.boardMembersRepository,
      board,
      request.userId,
      'read',
    );

    const cardWithLabels = await this.cardsRepository.findByIdWithLabels(
      cardId,
      boardId,
    );

    if (!cardWithLabels) {
      throw new ResourceNotFoundError('Card not found');
    }

    const { card, labelIds } = cardWithLabels;

    const [subtasks, boardLabels] = await Promise.all([
      this.cardsRepository.findSubtasks(cardId),
      this.boardLabelsRepository.findByBoardId(boardId),
    ]);

    const labelsMap = new Map(boardLabels.map((l) => [l.id, l]));

    return {
      card: cardToDTO(card, {
        labels: labelIds
          .map((labelId) => {
            const label = labelsMap.get(labelId);
            return label
              ? {
                  id: label.id,
                  boardId: label.boardId,
                  name: label.name,
                  color: label.color,
                  position: label.position,
                }
              : null;
          })
          .filter(Boolean) as Array<{
          id: string;
          boardId: string;
          name: string;
          color: string;
          position: number;
        }>,
        subtaskCount: subtasks.length,
      }),
    };
  }
}
